import { request } from '@/api/request'

export type UserReviewRow = {
  id: number
  rating: number
  comment?: string | null
  business_name?: string | null
  created_at?: string | null
}

type UserReviewsResponse = {
  reviews: UserReviewRow[]
  count: number
  pagination: {
    current_page: number
    per_page: number
    last_page: number
    total: number
  }
}

export async function fetchUserReviews(page = 1): Promise<UserReviewsResponse> {
  const response = await request.get<{
    success: boolean
    message: string
    data: UserReviewsResponse
  }>('/user/reviews', { params: { page, per_page: 20 } })

  const body = response.data
  if (!body?.success || !body.data) {
    throw new Error(body?.message || 'Could not load your reviews')
  }

  return body.data
}
