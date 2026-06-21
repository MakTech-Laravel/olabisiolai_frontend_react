function isUsableAddressLabel(label: string): boolean {
  const trimmed = label.trim()
  return Boolean(trimmed) && trimmed !== 'N/A' && !/^no location yet$/i.test(trimmed)
}

function resolveMapsDestination(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  addressLabel: string,
): string {
  const lat = latitude ?? null
  const lng = longitude ?? null
  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    return `${lat},${lng}`
  }

  const label = addressLabel.trim()
  if (isUsableAddressLabel(label)) {
    return encodeURIComponent(label)
  }

  return encodeURIComponent('Nigeria')
}

/** Opens Google Maps using saved coordinates when available, else address text. */
export function buildGoogleMapsSearchUrl(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  addressLabel: string,
): string {
  const destination = resolveMapsDestination(latitude, longitude, addressLabel)
  return `https://www.google.com/maps/search/?api=1&query=${destination}`
}

/** Opens Google Maps directions to the saved coordinates or address text. */
export function buildGoogleMapsDirectionsUrl(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  addressLabel: string,
): string {
  const destination = resolveMapsDestination(latitude, longitude, addressLabel)
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`
}
