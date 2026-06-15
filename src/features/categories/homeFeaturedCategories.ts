import type { CategoryDto } from '@/features/categories/types'

/** Curated categories for the home page grid (max 10). */
export const HOME_FEATURED_CATEGORY_NAMES = [
  'Cleaners',
  'Electricians',
  'Plumbers',
  'Caterers',
  'Event Planners',
  'Photographers',
  'Hair Stylists',
  'Barbers',
  'Movers',
  'AC Technicians',
] as const

export const HOME_CATEGORY_DISPLAY_LIMIT = HOME_FEATURED_CATEGORY_NAMES.length

export function selectHomeCategories(categories: CategoryDto[]): CategoryDto[] {
  const byName = new Map(categories.map((category) => [category.name, category]))

  const featured = HOME_FEATURED_CATEGORY_NAMES.map((name) => byName.get(name)).filter(
    (category): category is CategoryDto => category != null,
  )

  if (featured.length >= HOME_CATEGORY_DISPLAY_LIMIT) {
    return featured.slice(0, HOME_CATEGORY_DISPLAY_LIMIT)
  }

  const featuredIds = new Set(featured.map((category) => category.id))
  const remainder = categories.filter((category) => !featuredIds.has(category.id))

  return [...featured, ...remainder].slice(0, HOME_CATEGORY_DISPLAY_LIMIT)
}
