/** Matches Laravel `CategoryResource` (subset used in UI). */
export type CategoryDto = {
  id: number
  name: string
  subcategories: string[]
  subcategories_count?: number
  business_count?: number
  icon?: string | null
  icon_url?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type AdminCategoriesListResult = {
  categories: CategoryDto[]
  pagination: {
    current_page: number
    per_page: number
    last_page: number
    total: number
  }
  filter: { search: string | null }
  count: number
}
