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

export function getFollowErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as LaravelEnvelope<unknown> | undefined
    if (data?.message) return data.message
  }

  if (error instanceof Error && error.message) return error.message
  return fallback
}
