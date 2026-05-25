import { request } from '@/api/request'
import { laravelInnerData } from '@/features/categories/categoryParsers'
import { parseLocationFilterList } from '@/features/locations/locationParsers'
import type { LocationFilterOption } from '@/features/locations/types'

/**
 * `GET /locations` on `VITE_API_BASE_URL` — full catalog for filter radios (options must not shrink when `location_id` is set).
 */
export async function fetchPublicLocations(): Promise<LocationFilterOption[]> {
  try {
    const res = await request.get('/locations', { skipAuthRedirect: true })
    const inner = laravelInnerData(res.data)
    const raw = inner?.locations
    return parseLocationFilterList(raw)
  } catch (error) {
    console.warn('[locations] GET /locations failed', error)
    return []
  }
}
