import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/Apps/',
  build: {
    target: 'es2018',
  },
  plugins: [react()],
})
