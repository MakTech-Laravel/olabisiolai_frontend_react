import type { ResolvedSeoDto } from '@/features/seo/types'
import { parseResolvedSeo } from '@/features/seo/seoParsers'
import { normalizeRequestPath } from '@/ssr/publicPaths'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function apiBaseUrl(): string {
  const fromVite = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()
  if (fromVite) return fromVite.replace(/\/+$/, '')
  return 'http://127.0.0.1:8000/api/v1'
}

export async function fetchSeoForPath(pathname: string): Promise<ResolvedSeoDto | null> {
  const path = normalizeRequestPath(pathname)
  const url = `${apiBaseUrl()}/seo-pages/resolve?path=${encodeURIComponent(path)}`
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return null
    const json = (await res.json()) as { success?: boolean; data?: unknown }
    if (json.success === false) return null
    return parseResolvedSeo(json.data ?? json)
  } catch {
    return null
  }
}

/** Build HTML snippets for <head> injection (server-side). */
export function buildSeoHeadHtml(seo: ResolvedSeoDto | null): string {
  const title = seo?.title?.trim() || 'Gidira'
  const parts: string[] = [`<title>${escapeHtml(title)}</title>`]

  if (seo?.description) {
    parts.push(`<meta name="description" content="${escapeHtml(seo.description)}" />`)
  }
  if (seo?.keywords) {
    parts.push(`<meta name="keywords" content="${escapeHtml(seo.keywords)}" />`)
  }
  if (seo?.robots) {
    parts.push(`<meta name="robots" content="${escapeHtml(seo.robots)}" />`)
  }
  if (seo?.canonical) {
    parts.push(`<link rel="canonical" href="${escapeHtml(seo.canonical)}" />`)
  }

  if (seo) {
    for (const [property, content] of Object.entries(seo.og)) {
      if (!content) continue
      parts.push(
        `<meta property="og:${escapeHtml(property)}" content="${escapeHtml(content)}" />`,
      )
    }
    for (const [name, content] of Object.entries(seo.twitter)) {
      if (!content) continue
      parts.push(
        `<meta name="twitter:${escapeHtml(name)}" content="${escapeHtml(content)}" />`,
      )
    }
    for (const block of seo.jsonLd) {
      const json = JSON.stringify(block)
      parts.push(`<script type="application/ld+json">${json}</script>`)
    }
  }

  return `<!--gidira-seo-start-->\n    ${parts.join('\n    ')}\n    <!--gidira-seo-end-->`
}

export function injectSeoIntoTemplate(template: string, seoHtml: string): string {
  let html = template.replace(/<title>[^<]*<\/title>/i, '')
  html = html.replace(/\s*<!--gidira-seo-start-->[\s\S]*?<!--gidira-seo-end-->\s*/i, '\n')
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${seoHtml}\n  </head>`)
  }
  return `${seoHtml}\n${html}`
}
