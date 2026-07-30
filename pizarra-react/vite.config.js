import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' so the built site works from any static path (Vercel, subfolder, file://)
export default defineConfig({
  plugins: [react()],
  base: './',
})
