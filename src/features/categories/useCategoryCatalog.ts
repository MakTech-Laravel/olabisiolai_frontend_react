import { useQuery } from '@tanstack/react-query'

import { fetchPublicCategories } from '@/features/categories/publicCategoriesApi'
import type { CategoryDto } from '@/features/categories/types'

const staleMs = 5 * 60 * 1000

export function useCategoryCatalog() {
  return useQuery<CategoryDto[]>({
    queryKey: ['categories', 'public'],
    queryFn: fetchPublicCategories,
    staleTime: staleMs,
  })
}
