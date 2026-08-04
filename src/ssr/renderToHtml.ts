import { Writable } from 'node:stream'
import type { ReactElement } from 'react'
import { renderToPipeableStream } from 'react-dom/server'

/**
 * Wait until every Suspense boundary has resolved, then return complete HTML.
 * Prefer this over streaming for public SEO pages so crawlers see real body content.
 */
export function renderAppToHtml(element: ReactElement): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false
    const { pipe } = renderToPipeableStream(element, {
      onAllReady() {
        const chunks: Buffer[] = []
        const writable = new Writable({
          write(chunk, _encoding, callback) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
            callback()
          },
        })
        writable.on('finish', () => {
          if (settled) return
          settled = true
          resolve(Buffer.concat(chunks).toString('utf8'))
        })
        writable.on('error', (err) => {
          if (settled) return
          settled = true
          reject(err)
        })
        pipe(writable)
      },
      onError(error) {
        console.error('[ssr] render error', error)
        if (!settled) {
          settled = true
          reject(error)
        }
      },
    })
  })
}
