import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The Tailwind plugin is deliberately absent: this project styles with CSS
// Modules, and Tailwind v4's @layer base preflight collides with our own reset.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
