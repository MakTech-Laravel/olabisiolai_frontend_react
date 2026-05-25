import { request } from '@/api/request'

import type { UserSettingsProfile } from '@/api/userSettings'

type ProfileApiEnvelope = {
  success: boolean
  message: string
  data: UserSettingsProfile
}

/** `GET /user/profile` — customer profile row (no JSON `settings`). */
export async function fetchUserProfile(): Promise<UserSettingsProfile> {
  const response = await request.get<ProfileApiEnvelope>('/user/profile')
  const body = response.data
  if (!body?.success || !body.data) {
    throw new Error(body?.message || 'Could not load profile')
  }
  return body.data
}

export type PatchUserProfileBody = {
  first_name?: string
  last_name?: string
  phone?: string | null
}

/** `PATCH /user/profile` — update name / phone only (same `users` table). */
export async function patchUserProfile(body: PatchUserProfileBody): Promise<UserSettingsProfile> {
  const response = await request.patch<ProfileApiEnvelope>('/user/profile', body)
  const resBody = response.data
  if (!resBody?.success || !resBody.data) {
    throw new Error(resBody?.message || 'Could not update profile')
  }
  return resBody.data
}
