import type { UserFavoriteBusiness } from '@/api/favorites'

export const USER_FAVORITE_PLACEHOLDER_IMAGE = '/images/feature/1.jpg'

export function userFavoriteImage(f: UserFavoriteBusiness): string {
  return f.cover_photo_url || f.logo_url || USER_FAVORITE_PLACEHOLDER_IMAGE
}

export function userFavoriteLocationLabel(f: UserFavoriteBusiness): string {
  const full = f.location?.full_name?.trim()
  if (full) return full
  const city = f.location?.city?.trim()
  const state = f.location?.state?.trim()
  const parts = [city, state].filter(Boolean)
  return parts.length ? parts.join(', ') : 'Location unavailable'
}
