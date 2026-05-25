import type { LgaMapPickResult } from '@/features/maps/lgaMapPickTypes'

function placeLocationToLiteral(loc: google.maps.LatLng | google.maps.LatLngLiteral): google.maps.LatLngLiteral {
  if (loc instanceof google.maps.LatLng) {
    return { lat: loc.lat(), lng: loc.lng() }
  }
  const lit = loc as google.maps.LatLngLiteral
  return { lat: lit.lat, lng: lit.lng }
}

function componentByType(
  components: google.maps.places.AddressComponent[] | undefined,
  type: string,
): string | null {
  if (!components?.length) return null
  const found = components.find((c) => c.types.includes(type))
  return found?.longText ?? null
}

export function parsePlaceToLgaPick(place: google.maps.places.Place): LgaMapPickResult | null {
  const loc = place.location
  if (!loc) return null

  const { lat, lng } = placeLocationToLiteral(loc)

  const vp = place.viewport
  let viewport: LgaMapPickResult['viewport'] = null
  if (vp) {
    const ne = vp.getNorthEast()
    const sw = vp.getSouthWest()
    viewport = {
      north: ne.lat(),
      east: ne.lng(),
      south: sw.lat(),
      west: sw.lng(),
    }
  }

  const components = place.addressComponents ?? []
  const addressComponentsJson = JSON.stringify(
    components.map((c: google.maps.places.AddressComponent) => ({
      longText: c.longText,
      shortText: c.shortText,
      types: c.types,
    })),
  )

  return {
    googlePlaceId: place.id,
    resourceName: place.resourceName,
    displayName: place.displayName ?? null,
    formattedAddress: place.formattedAddress ?? null,
    lat,
    lng,
    country: componentByType(components, 'country'),
    administrativeAreaLevel1: componentByType(components, 'administrative_area_level_1'),
    administrativeAreaLevel2: componentByType(components, 'administrative_area_level_2'),
    locality: componentByType(components, 'locality'),
    viewport,
    addressComponentsJson,
  }
}
