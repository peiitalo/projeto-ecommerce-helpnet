import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
  }
})
