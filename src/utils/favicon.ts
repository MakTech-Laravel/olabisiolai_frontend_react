const ICON_FALLBACK = '/favicon.svg'
const CACHE_KEY = 'react-vite-laravel.favicon.cache.v1'

type CacheEntry = {
  url: string
  ts: number
}

type LoadOptions = {
  apiUrl?: string
  responsePath?: string
  ttlMs?: number
}

function getLinkEl() {
  const existing = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (existing) return existing
  const link = document.createElement('link')
  link.rel = 'icon'
  document.head.appendChild(link)
  return link
}

function getByPath(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined
  return path.split('.').reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== 'object') return undefined
    return (acc as Record<string, unknown>)[key]
  }, obj)
}

function loadCache(ttlMs?: number): string | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry
    if (!parsed?.url) return null
    if (ttlMs && Date.now() - parsed.ts > ttlMs) return null
    return parsed.url
  } catch {
    return null
  }
}

function saveCache(url: string) {
  try {
    const data: CacheEntry = { url, ts: Date.now() }
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    // ignore cache write failure
  }
}

export function setFavicon(url?: string) {
  const finalUrl = url && url.trim() ? url : ICON_FALLBACK
  const link = getLinkEl()
  link.href = finalUrl
  return finalUrl
}

export async function loadFavicon(options: LoadOptions = {}) {
  const { apiUrl, responsePath = 'data.favicon', ttlMs } = options

  const cached = loadCache(ttlMs)
  if (cached) {
    setFavicon(cached)
    return cached
  }

  if (!apiUrl) {
    return setFavicon()
  }

  try {
    const res = await fetch(apiUrl, { method: 'GET' })
    if (!res.ok) throw new Error(`Favicon fetch failed: ${res.status}`)
    const json = (await res.json()) as unknown
    const next = getByPath(json, responsePath)
    if (typeof next === 'string' && next.trim()) {
      saveCache(next)
      setFavicon(next)
      return next
    }
    return setFavicon()
  } catch {
    return setFavicon()
  }
}

