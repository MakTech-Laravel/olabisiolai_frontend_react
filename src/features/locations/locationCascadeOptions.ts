import type { LocationFilterOption } from '@/features/locations/types'

export function uniqueStatesFromCatalog(locations: LocationFilterOption[]): string[] {
  return [...new Set(locations.map((entry) => entry.stateName).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  )
}

export function uniqueCitiesFromCatalog(
  locations: LocationFilterOption[],
  stateName: string,
): string[] {
  if (!stateName) return []
  return [
    ...new Set(
      locations.filter((entry) => entry.stateName === stateName).map((entry) => entry.cityName),
    ),
  ]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
}

export function lgaOptionsForStateCity(
  locations: LocationFilterOption[],
  stateName: string,
  cityName: string,
): LocationFilterOption[] {
  if (!stateName || !cityName) return []
  return locations
    .filter((entry) => entry.stateName === stateName && entry.cityName === cityName)
    .sort((a, b) => a.lgaName.localeCompare(b.lgaName))
}

export function findLocationById(
  locations: LocationFilterOption[],
  id: number | null,
): LocationFilterOption | null {
  if (id === null) return null
  return locations.find((entry) => entry.id === id) ?? null
}
