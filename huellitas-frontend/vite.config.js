import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Vite 8 minifica el CSS con lightningcss por defecto y este falla sobre
    // @keyframes válidos dentro de los CSS Modules. Usamos esbuild (mismo motor
    // del modo dev) para minificar el CSS y así el build de producción funciona.
    cssMinify: 'esbuild'
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5010',
        changeOrigin: true,
        secure: false 
      }
    }
  }
})