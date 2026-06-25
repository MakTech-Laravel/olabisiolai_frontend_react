import axios from 'axios'

import { request } from '@/api/request'

export type FollowToggleData = {
  following: boolean
  following_user_id: number
  followers_count?: number
}

export type FollowStats = {
  user_id: number
  followers_count: number
  following_count: number
}

export type FollowingBusiness = {
  following_user_id: number
  followed_at: string
  vendor: {
    id: number
    uuid: string
    name: string
    image_url: string | null
  } | null
  business: {
    id: number
    business_name: string
    logo_url: string | null
    category_name: string | null
    location: string | null
  } | null
}

export type FollowingListPayload = {
  following: FollowingBusiness[]
  count: number
  pagination: {
    current_page: number
    per_page: number
    last_page: number
    total: number
  }
}

export const USER_FOLLOWING_DEFAULT_PER_PAGE = 12

export type FollowerUser = {
  follower_user_id: number
  followed_at: string
  user: {
    id: number
    uuid: string
    name: string
    image_url: string | null
  } | null
}

export type FollowersListPayload = {
  followers: FollowerUser[]
  count: number
  pagination: {
    current_page: number
    per_page: number
    last_page: number
    total: number
  }
}

export const USER_FOLLOWERS_DEFAULT_PER_PAGE = 20

export async function fetchBusinessFollowers(params: {
  business_id: number
  page?: number
  per_page?: number
}): Promise<FollowersListPayload> {
  const response = await request.get<LaravelEnvelope<FollowersListPayload>>('/user/follows/followers', {
    params,
  })

  return assertFollowSuccess(response.data, 'Could not load followers list.')
}

type LaravelEnvelope<T> = {
  success?: boolean
  message?: string
  data?: T
}

function assertFollowSuccess<T>(body: LaravelEnvelope<T> | undefined, fallback: string): T {
  if (body?.success && body.data !== undefined && body.data !== null) {
    return body.data
  }

  throw new Error(body?.message || fallback)
}

export async function toggleFollow(followingUserId: number): Promise<FollowToggleData> {
  const response = await request.post<LaravelEnvelope<FollowToggleData>>('/user/follows/toggle', {
    following_user_id: followingUserId,
  })

  return assertFollowSuccess(
    response.data,
    'Could not update follow status. Please try again.',
  )
}

export async function fetchFollowStats(userId?: number): Promise<FollowStats> {
  const response = await request.get<LaravelEnvelope<FollowStats>>('/user/follows/stats', {
    params: userId ? { user_id: userId } : undefined,
  })

  return assertFollowSuccess(response.data, 'Could not load follow stats.')
}

export async function fetchFollowing(params?: {
  page?: number
  per_page?: number
}): Promise<FollowingListPayload> {
  const response = await request.get<LaravelEnvelope<FollowingListPayload>>('/user/follows/following', {
    params,
  })

  return assertFollowSuccess(response.data, 'Could not load following list.')
}

export function getFollowErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as LaravelEnvelope<unknown> | undefined
    if (data?.message) return data.message
  }

  if (error instanceof Error && error.message) return error.message
  return fallback
}
