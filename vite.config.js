import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { getTestFirebaseConfig } from './scripts/firebaseConfig.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Fail before a local start or Vercel build can create an artifact connected
  // to production or to a mixture of Firebase projects.
  getTestFirebaseConfig(env)

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5000,
      allowedHosts: true,
      headers: {
        'Service-Worker-Allowed': '/',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      middlewareMode: false
    }
  }
})
