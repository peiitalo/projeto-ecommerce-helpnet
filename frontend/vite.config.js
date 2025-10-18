import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs';

const isDocker = process.env.VITE_DOCKER_ENV === 'true' || fs.existsSync('/.dockerenv');
const backendUrl = isDocker ? 'http://backend:3001' : 'http://localhost:3001';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // bind 0.0.0.0 and let HMR use the browser's hostname
    port: 5173,
    strictPort: true,
    hmr: {
      // Ensure the client connects back on the exposed port
      clientPort: 5173,
    },
    proxy: {
      '/api/uploads': {
        target: backendUrl,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/uploads/, '/uploads'),
      },
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        secure: false,
      },
    },
  }
})
