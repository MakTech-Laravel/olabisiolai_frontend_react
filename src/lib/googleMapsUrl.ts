/** Opens Google Maps search/directions for a business address or coordinates. */
export function buildGoogleMapsSearchUrl(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  addressLabel: string,
): string {
  const label = addressLabel.trim()
  const isPlaceholder =
    !label ||
    label === 'N/A' ||
    /^no location yet$/i.test(label)

  if (!isPlaceholder) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(label)}`
  }

  const lat = latitude ?? null
  const lng = longitude ?? null
  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Nigeria')}`
}
