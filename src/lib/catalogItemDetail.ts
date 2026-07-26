/** Public catalog item details path (e.g. `/catalog/items/1`). */
export function catalogItemDetailPath(itemId: number): string {
  return `/catalog/items/${itemId}`
}

/** Absolute or relative public URL for a catalog item. */
export function catalogItemDetailUrl(itemId: number, absolute = false): string {
  const path = catalogItemDetailPath(itemId)
  if (!absolute || typeof window === 'undefined') return path
  return `${window.location.origin}${path}`
}

/**
 * Normalize legacy business-profile catalog deep links
 * (`/businesses/:slug?catalog=1`) to `/catalog/items/1`.
 */
export function resolveCatalogItemPathFromUrl(urlOrPath: string): string {
  const raw = urlOrPath.trim()
  if (!raw) return raw

  try {
    const parsed = new URL(raw, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    const catalogId = Number(parsed.searchParams.get('catalog') ?? '')
    if (Number.isFinite(catalogId) && catalogId > 0) {
      return catalogItemDetailPath(catalogId)
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return raw
  }
}
