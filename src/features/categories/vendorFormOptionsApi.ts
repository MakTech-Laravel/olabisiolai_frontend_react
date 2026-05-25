import { request } from '@/api/request'
import { laravelInnerData, parseCategoryList } from '@/features/categories/categoryParsers'
import type { CategoryDto } from '@/features/categories/types'

export type VendorFormOptions = {
  categories: CategoryDto[]
  locations: unknown
}

/**
 * `GET /vendor/business/form-options` — Laravel returns categories + location tree (vendor auth).
 */
export async function fetchVendorBusinessFormOptions(): Promise<VendorFormOptions> {
  const res = await request.get('/vendor/business/form-options')
  const inner = laravelInnerData(res.data)
  const categories = parseCategoryList(inner?.categories)
  return {
    categories,
    locations: inner?.locations ?? null,
  }
}
