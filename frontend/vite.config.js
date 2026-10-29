import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
    watch: {
      // Polling solo donde hace falta: Docker/VMs con bind mounts (en
      // Windows/macOS el fs montado no emite eventos inotify). En dev nativo
      // queda apagado para no quemar CPU. Activar con VITE_USE_POLLING=true.
      usePolling: process.env.VITE_USE_POLLING === 'true',
    },
  },
})
