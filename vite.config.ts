import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 700,
  },
  server: {
    /**
     * Dev-only proxy endpoints to keep secrets out of the browser bundle.
     * Do NOT use this for production; move to Laravel backend instead.
     */
    middlewareMode: false,
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    {
      name: 'dev-flutterwave-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          try {
            if (!req.url?.startsWith('/__dev/flutterwave/')) return next()

            if (process.env.NODE_ENV && process.env.NODE_ENV !== 'development') {
              res.statusCode = 404
              res.end('Not found')
              return
            }

            const secret = process.env.FLW_SECRET_KEY?.trim()
            if (!secret) {
              res.statusCode = 500
              res.setHeader('content-type', 'application/json')
              res.end(
                JSON.stringify({
                  error:
                    'Missing FLW_SECRET_KEY in environment. Put it in .env as FLW_SECRET_KEY=... (no VITE_ prefix) then restart dev server.',
                }),
              )
              return
            }

            // Endpoint: GET /__dev/flutterwave/verify/:transaction_id
            const verifyMatch = req.url.match(/^\/__dev\/flutterwave\/verify\/([^/?#]+)/)
            if (req.method === 'GET' && verifyMatch) {
              const transactionId = decodeURIComponent(verifyMatch[1]!)

              const upstream = await fetch(
                `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(
                  transactionId,
                )}/verify`,
                {
                  method: 'GET',
                  headers: {
                    Authorization: `Bearer ${secret}`,
                    'Content-Type': 'application/json',
                  },
                },
              )

              const text = await upstream.text()
              res.statusCode = upstream.status
              res.setHeader('content-type', upstream.headers.get('content-type') ?? 'application/json')
              res.end(text)
              return
            }

            res.statusCode = 404
            res.end('Unknown dev proxy route')
          } catch (e) {
            res.statusCode = 500
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ error: 'Dev proxy error', detail: String(e) }))
          }
        })
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
