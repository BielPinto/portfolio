import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget =
    env.VITE_API_PROXY_TARGET?.trim() || 'http://127.0.0.1:8080'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        // POST /contact → API (same path as SPA route; GET stays with Vite for the React page).
        '/contact': {
          target: apiProxyTarget,
          changeOrigin: true,
          bypass(req) {
            if (req.method === 'GET' || req.method === 'HEAD') {
              return req.url
            }
          },
        },
      },
    },
  }
})
