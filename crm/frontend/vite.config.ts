import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [tailwindcss(), react()],
    base: "/",
    build: { outDir: "dist" },
    server: {
        port: 5173,
        strictPort: true,
        proxy: {
            "/api": {
                target:
                    process.env.VITE_DEV_API_PROXY ?? "http://localhost:4000",
                changeOrigin: true,
            },
        },
    },
    preview: {
        port: 3003,
        strictPort: true,
        // nginx proxies crm.aranax.tech to this process and forwards the
        // original Host header; Vite's preview server rejects unrecognized
        // hosts by default as a DNS-rebinding protection.
        allowedHosts: ["crm.aranax.tech"],
    },
});
