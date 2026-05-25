/** Point chosen on the Nigeria map for public business search. */
export type GeoMapPick = {
  lat: number
  lng: number
  label: string
}

export const DEFAULT_GEO_SEARCH_RADIUS_KM = 30

export const NIGERIA_MAP_BOUNDS: google.maps.LatLngBoundsLiteral = {
  north: 13.892,
  south: 4.272,
  east: 14.677,
  west: 2.692,
}

export const NIGERIA_MAP_CENTER: google.maps.LatLngLiteral = { lat: 9.082, lng: 8.6753 }
