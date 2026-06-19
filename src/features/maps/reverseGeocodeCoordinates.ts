import { importLibrary } from '@googlemaps/js-api-loader'

import type { LgaMapPickResult } from '@/features/maps/lgaMapPickTypes'

function extractComponent(
  components: google.maps.GeocoderAddressComponent[] | undefined,
  type: string,
): string | null {
  if (!components?.length) return null
  const found = components.find((c) => c.types.includes(type))
  return found?.long_name ?? null
}

function pickFromGeocoderResult(
  result: google.maps.GeocoderResult,
  location: google.maps.LatLngLiteral,
): LgaMapPickResult {
  const viewportBounds = result.geometry?.viewport ?? null
  const viewport = viewportBounds
    ? {
        north: viewportBounds.getNorthEast().lat(),
        east: viewportBounds.getNorthEast().lng(),
        south: viewportBounds.getSouthWest().lat(),
        west: viewportBounds.getSouthWest().lng(),
      }
    : null

  const components = result.address_components ?? []
  const addressComponentsJson = JSON.stringify(
    components.map((c) => ({
      longText: c.long_name,
      shortText: c.short_name,
      types: c.types,
    })),
  )

  return {
    googlePlaceId: result.place_id || `latlng:${location.lat.toFixed(6)},${location.lng.toFixed(6)}`,
    resourceName: undefined,
    displayName: result.formatted_address ?? null,
    formattedAddress: result.formatted_address ?? null,
    lat: location.lat,
    lng: location.lng,
    country: extractComponent(components, 'country'),
    administrativeAreaLevel1: extractComponent(components, 'administrative_area_level_1'),
    administrativeAreaLevel2: extractComponent(components, 'administrative_area_level_2'),
    locality: extractComponent(components, 'locality'),
    viewport,
    addressComponentsJson,
  }
}

export async function reverseGeocodeCoordinates(
  lat: number,
  lng: number,
): Promise<LgaMapPickResult | null> {
  await importLibrary('geocoding')
  const geocoder = new google.maps.Geocoder()
  const resp = await geocoder.geocode({ location: { lat, lng } })
  const result = resp.results?.[0]
  if (!result) return null
  return pickFromGeocoderResult(result, { lat, lng })
}

export async function captureCurrentLocationPick(): Promise<LgaMapPickResult> {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported on this device.')
  }

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 20_000,
      maximumAge: 0,
    })
  })

  const lat = position.coords.latitude
  const lng = position.coords.longitude
  const pick = await reverseGeocodeCoordinates(lat, lng)
  if (!pick) {
    throw new Error('Could not determine your area from GPS coordinates.')
  }

  return pick
}
