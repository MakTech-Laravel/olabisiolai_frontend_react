import axios from 'axios'

import { request } from '@/api/request'

/** Default page size for `GET /user/favorites` (dashboard + favorites page). */
export const USER_FAVORITES_DEFAULT_PER_PAGE = 12

export type FavoriteToggleData = {
  favorited: boolean
  business_info_id: number
}

type LaravelEnvelope<T> = {
  success?: boolean
  message?: string
  data?: T
}

function assertFavoriteResponse(
  body: LaravelEnvelope<unknown> | undefined,
  fallback: string,
): void {
  if (body?.success) return
  throw new Error(body?.message || fallback)
}

function assertFavoriteSuccess<T>(body: LaravelEnvelope<T> | undefined, fallback: string): T {
  if (body?.success && body.data !== undefined && body.data !== null) {
    return body.data
  }

  throw new Error(body?.message || fallback)
}

export async function toggleFavorite(businessInfoId: number): Promise<FavoriteToggleData> {
  const response = await request.post<LaravelEnvelope<FavoriteToggleData>>(
    '/user/favorites/toggle',
    {
      business_info_id: businessInfoId,
    },
  )

  return assertFavoriteSuccess(
    response.data,
    'Could not update saved listing. Please try again.',
  )
}

/** `DELETE /user/favorites/:id` — remove saved favorite (authenticated). */
export async function removeFavorite(businessInfoId: number): Promise<void> {
  const response = await request.delete<LaravelEnvelope<null>>(
    `/user/favorites/${businessInfoId}`,
  )

  assertFavoriteResponse(
    response.data,
    'Could not remove saved listing. Please try again.',
  )
}

export type UserFavoriteLocation = {
  state: string
  city: string
  full_name: string
}

export type UserFavoriteBusiness = {
  business_info_id: number
  business_name: string
  category_name: string
  location: UserFavoriteLocation
  rating: number
  reviews_count: number
  is_verified: boolean
  logo_url: string | null
  cover_photo_url: string | null
  phone: string | null
  whatsapp: string | null
  website: string | null
}

export type UserFavoritesPayload = {
  favorites: UserFavoriteBusiness[]
  count: number
  pagination: {
    current_page: number
    per_page: number
    last_page: number
    total: number
  }
}

type UserFavoritesApiEnvelope = {
  success: boolean
  message: string
  data: UserFavoritesPayload
}

export async function fetchUserFavorites(params?: {
  page?: number
  per_page?: number
}): Promise<UserFavoritesPayload> {
  const response = await request.get<UserFavoritesApiEnvelope>('/user/favorites', { params })
  const body = response.data
  if (!body?.success || !body.data) {
    throw new Error(body?.message || 'Could not load favorites')
  }
  return body.data
}

export function getFavoriteErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as LaravelEnvelope<unknown> | undefined
    if (data?.message) return data.message
  }

  if (error instanceof Error && error.message) return error.message
  return fallback
}
