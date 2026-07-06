import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // All /api/* calls are forwarded to the backend.
      // This avoids CORS entirely during local development.
      '/api': {
        target: 'https://vitrine3d-latest.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
