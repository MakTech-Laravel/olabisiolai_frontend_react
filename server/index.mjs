import express from 'express'
import compression from 'compression'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load ../.env into process.env when unset (local `npm run dev` / `npm start`).
try {
  const envPath = path.resolve(__dirname, '../.env')
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq <= 0) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      if (process.env[key] === undefined) process.env[key] = val
    }
  }
} catch {
  // ignore missing/unreadable .env
}

const isProd = process.env.NODE_ENV === 'production'
const port = Number(process.env.PORT || 3000)
const apiOrigin = (
  process.env.SPA_SHELL_API_ORIGIN ||
  process.env.VITE_SPA_SHELL_API_ORIGIN ||
  'https://api.gidira.tech'
).replace(/\/+$/, '')

/**
 * @param {string} html
 * @param {{ appHtml?: string, seoHeadHtml?: string, dehydratedState?: unknown, routerState?: unknown }} payload
 */
function applySsrToTemplate(html, payload) {
  let out = html
  if (payload.seoHeadHtml) {
    out = out.replace(/<title>[^<]*<\/title>/i, '')
    out = out.replace(/\s*<!--gidira-seo-start-->[\s\S]*?<!--gidira-seo-end-->\s*/i, '\n')
    if (/<\/head>/i.test(out)) {
      out = out.replace(/<\/head>/i, `${payload.seoHeadHtml}\n  </head>`)
    }
  }

  const appHtml = payload.appHtml ?? ''
  out = out.replace('<!--ssr-outlet-->', () => appHtml)

  const bootstrap = `<script>window.__REACT_QUERY_STATE__=${serializeForScript(
    payload.dehydratedState ?? null,
  )};window.__STATIC_ROUTER_HYDRATION_DATA__=${serializeForScript(
    payload.routerState ?? null,
  )};</script>`
  out = out.replace('</body>', `${bootstrap}\n  </body>`)
  return out
}

/** @param {unknown} value */
function serializeForScript(value) {
  return JSON.stringify(value)?.replace(/</g, '\\u003c') ?? 'null'
}

/** @param {unknown} context */
function serializeRouterContext(context) {
  if (!context || typeof context !== 'object') return null
  const ctx = /** @type {Record<string, unknown>} */ (context)
  return {
    loaderData: ctx.loaderData ?? null,
    actionData: ctx.actionData ?? null,
    errors: ctx.errors ?? null,
  }
}

async function proxyLaravelAsset(req, res, assetPath) {
  try {
    const upstream = await fetch(`${apiOrigin}${assetPath}`, {
      headers: { Accept: req.headers.accept || '*/*' },
      signal: AbortSignal.timeout(8000),
    })
    const buf = Buffer.from(await upstream.arrayBuffer())
    res.status(upstream.status)
    const ct = upstream.headers.get('content-type')
    if (ct) res.setHeader('Content-Type', ct)
    res.send(buf)
  } catch (err) {
    console.error(`[ssr] proxy ${assetPath} failed`, err)
    res.status(502).send('Bad Gateway')
  }
}

async function createServer() {
  const app = express()
  app.disable('x-powered-by')
  app.use(compression())

  /** @type {import('vite').ViteDevServer | undefined} */
  let vite
  /** @type {(url: string) => Promise<any>} */
  let render
  /** @type {(pathname: string) => boolean} */
  let shouldSsrPath
  let templateHtml = ''

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite')
    vite = await createViteServer({
      root: path.resolve(__dirname, '..'),
      server: { middlewareMode: true },
      appType: 'custom',
    })
    app.use(vite.middlewares)
  } else {
    const clientDist = path.resolve(__dirname, '../dist/client')
    templateHtml = fs.readFileSync(path.join(clientDist, 'index.html'), 'utf-8')
    const sirv = (await import('sirv')).default
    app.use(
      sirv(clientDist, {
        extensions: [],
        gzip: true,
        brotli: true,
        single: false,
      }),
    )
    const serverEntryUrl = pathToFileURL(
      path.resolve(__dirname, '../dist/server/entry-server.js'),
    ).href
    const mod = await import(serverEntryUrl)
    render = mod.render
    shouldSsrPath = mod.shouldSsrPath
  }

  app.get('/robots.txt', (req, res) => {
    void proxyLaravelAsset(req, res, '/robots.txt')
  })
  app.get('/sitemap.xml', (req, res) => {
    void proxyLaravelAsset(req, res, '/sitemap.xml')
  })

  app.get('/healthz', (_req, res) => {
    res.type('text').send('ok')
  })

  app.use(async (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()

    const urlPath = req.path || '/'
    if (urlPath.startsWith('/@') || urlPath.startsWith('/src/') || urlPath.startsWith('/node_modules')) {
      return next()
    }
    if (/\.\w{1,8}$/.test(urlPath) && !urlPath.endsWith('.html')) {
      return next()
    }

    try {
      const url = req.originalUrl || urlPath

      if (!isProd && vite) {
        const pathsMod = await vite.ssrLoadModule('/src/ssr/publicPaths.ts')
        shouldSsrPath = pathsMod.shouldSsrPath
        const renderMod = await vite.ssrLoadModule('/src/entry-server.tsx')
        render = renderMod.render
        let template = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8')
        template = await vite.transformIndexHtml(url, template)
        templateHtml = template
      }

      if (!shouldSsrPath(urlPath)) {
        const html = applySsrToTemplate(templateHtml, {
          appHtml: '',
          seoHeadHtml: '',
          dehydratedState: null,
          routerState: null,
        })
        res.status(200).set({ 'Content-Type': 'text/html; charset=UTF-8' }).end(html)
        return
      }

      const result = await render(url)
      if (result.redirectTo) {
        res.redirect(result.status || 302, result.redirectTo)
        return
      }

      const html = applySsrToTemplate(templateHtml, {
        appHtml: result.appHtml,
        seoHeadHtml: result.seoHeadHtml,
        dehydratedState: result.dehydratedState,
        routerState: serializeRouterContext(result.routerState),
      })

      res
        .status(result.status || 200)
        .set({
          'Content-Type': 'text/html; charset=UTF-8',
          'Cache-Control': 'public, max-age=60',
        })
        .end(html)
    } catch (e) {
      if (vite) vite.ssrFixStacktrace(/** @type {Error} */ (e))
      console.error('[ssr] render failed, falling back to CSR shell', e)
      try {
        let fallback = templateHtml
        if (!fallback) {
          fallback = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8')
          if (vite) fallback = await vite.transformIndexHtml('/', fallback)
        }
        const html = applySsrToTemplate(fallback, { appHtml: '' })
        res.status(200).set({ 'Content-Type': 'text/html; charset=UTF-8' }).end(html)
      } catch (fallbackErr) {
        next(fallbackErr)
      }
    }
  })

  app.listen(port, () => {
    console.log(`[ssr] listening on http://localhost:${port} (${isProd ? 'prod' : 'dev'})`)
  })
}

createServer().catch((err) => {
  console.error(err)
  process.exit(1)
})
