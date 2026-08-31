import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/Python-Learning-Game/',
  plugins: [react()],
  worker: {
    format: 'es'
  }
})
