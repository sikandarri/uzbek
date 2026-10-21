import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { devApiPort } from '../scripts/dev-api-port.mjs';
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: `http://127.0.0.1:${devApiPort()}`, changeOrigin: false } },
  },
  build: { sourcemap: false },
});
