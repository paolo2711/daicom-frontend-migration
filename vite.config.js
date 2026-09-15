import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // Solo `npm run dev`. En el servidor esto lo hace nginx con `location /media`,
  // y asi los archivos salen del mismo origen que la pagina en los dos lados.
  server: {
    proxy: {
      '/media': 'http://localhost:8000',
    }
  }
})