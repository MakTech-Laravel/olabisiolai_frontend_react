import { defineConfig, type Plugin } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

/** Browser-only packages → SSR stubs (works for `ssrLoadModule` and `vite build --ssr`). */
function ssrBrowserShims(): Plugin {
  const shims: Record<string, string> = {
    '@paystack/inline-js': path.resolve(rootDir, './src/ssr/shims/paystack.ts'),
    'flutterwave-react-v3': path.resolve(rootDir, './src/ssr/shims/flutterwave.ts'),
    '@googlemaps/js-api-loader': path.resolve(rootDir, './src/ssr/shims/googleMaps.ts'),
    '@googlemaps/markerclusterer': path.resolve(rootDir, './src/ssr/shims/empty.ts'),
    'laravel-echo': path.resolve(rootDir, './src/ssr/shims/echo.ts'),
    'pusher-js': path.resolve(rootDir, './src/ssr/shims/empty.ts'),
    sweetalert2: path.resolve(rootDir, './src/ssr/shims/sweetalert2.ts'),
  }

  return {
    name: 'ssr-browser-shims',
    enforce: 'pre',
    resolveId(source, _importer, options) {
      if (!options?.ssr) return null
      const target = shims[source]
      return target ?? null
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 700,
  },
  // Keep react-router external on SSR so Node loads one shared context instance.
  ssr: {
    noExternal: ['@tanstack/react-query'],
    external: ['react-router', 'react-router-dom'],
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  server: {
    /**
     * Dev-only proxy endpoints to keep secrets out of the browser bundle.
     * Do NOT use this for production; move to Laravel backend instead.
     */
    middlewareMode: false,
  },
  plugins: [
    ssrBrowserShims(),
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
})
