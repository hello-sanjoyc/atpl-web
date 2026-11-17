import { buildApp } from "./app.js";
import { loadConfig } from "./config/env.js";
import { createContainer } from "./container.js";
import { startPoolMonitor } from "./db/client.js";

/** HTTP process entry point. Run in PM2 cluster mode. Background jobs run in worker.ts. */
async function main(): Promise<void> {
    const config = loadConfig();
    const container = createContainer(config);
    const app = await buildApp(container);
    const stopPoolMonitor = startPoolMonitor(
        container.pool,
        container.logger.child({ module: "db-pool" }),
    );

    await app.listen({ port: config.PORT, host: config.HOST });
    app.deps.logger.info(
        { event: "server.started", port: config.PORT },
        "HTTP server listening",
    );

    let shuttingDown = false;
    const shutdown = async (
        signal: string,
        exitCode: number,
    ): Promise<void> => {
        if (shuttingDown) return;
        shuttingDown = true;
        container.logger.info(
            { event: "server.stopping", signal },
            "Server shutting down",
        );
        const timer = setTimeout(
            () => process.exit(1),
            config.SHUTDOWN_TIMEOUT_MS,
        );
        timer.unref();
        try {
            stopPoolMonitor();
            await app.close();
            await container.close();
            clearTimeout(timer);
            process.exit(exitCode);
        } catch {
            process.exit(1);
        }
    };

    process.on("SIGTERM", () => void shutdown("SIGTERM", 0));
    process.on("SIGINT", () => void shutdown("SIGINT", 0));
    process.on("uncaughtException", (error) => {
        container.logger.fatal(
            { event: "process.uncaught_exception", errorName: error.name },
            "Uncaught exception; exiting",
        );
        void shutdown("uncaughtException", 1);
    });
    process.on("unhandledRejection", (reason) => {
        container.logger.fatal(
            {
                event: "process.unhandled_rejection",
                errorName: (reason as Error)?.name,
            },
            "Unhandled rejection; exiting",
        );
        void shutdown("unhandledRejection", 1);
    });
}

main().catch((error: unknown) => {
    process.stderr.write(
        `Server failed to start: ${(error as Error).message}\n`,
    );
    process.exit(1);
});
