import { env } from '@/config/env'

export function getApiOrigin(): string {
  return env.apiBaseUrl.replace(/\/?api\/v1\/?$/i, '')
}

function viteString(name: string): string | undefined {
  const v = (import.meta.env as Record<string, string | undefined>)[name]?.trim()
  return v || undefined
}

/** Pusher `wsHost` must be a hostname only — a full URL breaks the `wss://…` builder and can cause ERR_UNKNOWN_URL_SCHEME. */
export function normalizeReverbHost(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  let h = raw.trim()
  for (const prefix of ['https://', 'http://', 'wss://', 'ws://']) {
    if (h.toLowerCase().startsWith(prefix)) {
      h = h.slice(prefix.length)
    }
  }
  h = (h.split('/')[0] ?? '').trim()
  const colon = h.indexOf(':')
  if (colon > 0) {
    const rest = h.slice(colon + 1)
    if (/^\d+$/.test(rest)) {
      h = h.slice(0, colon)
    }
  }
  return h || undefined
}

export function normalizeReverbScheme(raw: string | undefined): 'http' | 'https' {
  const s = (raw ?? '').trim().toLowerCase()
  if (s === 'wss' || s === 'https' || s === 'tls' || s === 'ssl') return 'https'
  if (s === 'ws' || s === 'http') return 'http'
  return 'http'
}

function inferReverbSchemeFromApi(): 'http' | 'https' {
  try {
    return new URL(getApiOrigin()).protocol === 'https:' ? 'https' : 'http'
  } catch {
    return 'http'
  }
}

function reverbSchemeResolved(): 'http' | 'https' {
  const explicit = viteString('VITE_REVERB_SCHEME')
  if (explicit != null && explicit !== '') {
    return normalizeReverbScheme(explicit)
  }
  return inferReverbSchemeFromApi()
}

function reverbPortResolved(scheme: 'http' | 'https'): number {
  const raw = viteString('VITE_REVERB_PORT')
  if (raw != null && raw !== '') {
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : scheme === 'https' ? 443 : 8089
  }
  /** HTTPS + unset port → public 443. HTTP + unset → local Reverb default 8089. */
  return scheme === 'https' ? 443 : 8089
}

const _reverbScheme = reverbSchemeResolved()

export const messagingEnv = {
  broadcastingAuthUrl: `${getApiOrigin()}/broadcasting/auth`,
  reverbKey: viteString('VITE_REVERB_APP_KEY'),
  reverbHost: normalizeReverbHost(viteString('VITE_REVERB_HOST')),
  reverbPort: reverbPortResolved(_reverbScheme),
  reverbScheme: _reverbScheme === 'https' ? 'https' : 'http',
  isReverbConfigured(): boolean {
    return Boolean(this.reverbKey && this.reverbHost)
  },
}
