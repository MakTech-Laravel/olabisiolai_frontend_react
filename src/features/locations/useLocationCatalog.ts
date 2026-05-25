import { useQuery } from '@tanstack/react-query'

import { fetchPublicLocations } from '@/features/locations/publicLocationsApi'
import type { LocationFilterOption } from '@/features/locations/types'

const staleMs = 5 * 60 * 1000

export function useLocationCatalog() {
  return useQuery<LocationFilterOption[]>({
    queryKey: ['locations', 'public'],
    queryFn: fetchPublicLocations,
    staleTime: staleMs,
  })
}
