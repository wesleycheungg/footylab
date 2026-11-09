import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy /api to the Express server so the browser sees a single origin.
    // Keeps session cookies working in dev without CORS. Fetches still need
    // `credentials: 'include'`; a split-origin deploy also needs
    // cors({ origin, credentials: true }) and sameSite on the session cookie.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
