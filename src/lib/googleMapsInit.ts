import { setOptions } from '@googlemaps/js-api-loader'

let configuredKey: string | null = null

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
