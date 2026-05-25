import { request } from '@/api/request'
import { laravelInnerData, parseCategoryList } from '@/features/categories/categoryParsers'
import type { CategoryDto } from '@/features/categories/types'

/**
 * `GET /categories` on `VITE_API_BASE_URL` (e.g. `/api/v1/categories`) — unauthenticated catalog for home + filters.
 * Registered in Laravel `routes/api/v1/public.php` (`PublicCategoryCatalogController::index`).
 */
export async function fetchPublicCategories(): Promise<CategoryDto[]> {
  try {
    const res = await request.get('/categories', { skipAuthRedirect: true })
    const inner = laravelInnerData(res.data)
    const raw = inner?.categories
    return parseCategoryList(raw)
  } catch (error) {
    console.warn('[categories] GET /categories failed', error)
    return []
  }
}
