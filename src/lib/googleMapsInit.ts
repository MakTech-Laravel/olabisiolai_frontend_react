import { setOptions } from '@googlemaps/js-api-loader'

let configuredKey: string | null = null

declare global {
  interface Window {
    gm_authFailure?: () => void
  }
}

/**
 * Must run before any `importLibrary()` from `@googlemaps/js-api-loader`.
 * Safe to call multiple times with the same key.
 */
export function ensureGoogleMapsConfigured(apiKey: string): void {
  const trimmed = apiKey.trim()
  if (!trimmed) return
  if (configuredKey === trimmed) return
  if (configuredKey !== null && configuredKey !== trimmed) {
    console.warn(
      '[Google Maps] API key changed after first init; keeping the first key. Reload the page to switch keys.',
    )
    return
  }
  setOptions({ key: trimmed, v: 'weekly' })
  configuredKey = trimmed
}

export function onGoogleMapsAuthFailure(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const previous = window.gm_authFailure
  window.gm_authFailure = () => {
    previous?.()
    callback()
  }

  return () => {
    window.gm_authFailure = previous
  }
}
