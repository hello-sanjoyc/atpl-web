import "dotenv/config";

import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import postgres from "@fastify/postgres";
import Fastify from "fastify";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(helmet);
await app.register(multipart);

if (process.env.DATABASE_URL) {
    await app.register(postgres, {
        connectionString: process.env.DATABASE_URL,
    });
}

app.get("/health", async () => ({ status: "ok" }));

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

try {
    await app.listen({ host, port });
} catch (error) {
    app.log.error(error);
    process.exit(1);
}
