import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  base: '/',
  build: { outDir: 'dist' },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_PROXY ?? 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
