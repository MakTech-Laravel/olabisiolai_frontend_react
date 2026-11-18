import axios from 'axios'

import { request } from '@/api/request'
import type { AuthUser } from '@/auth/types'
import { getStoredAuthUser, setStoredAuthUser } from '@/auth/token'

type LaravelEnvelope<T> = {
  success?: boolean
  message?: string
  data?: T
}

export type ProfileModeSwitchData = {
  mode: 'customer' | 'vendor'
  created_business?: boolean
  business_id?: number | null
  user: AuthUser
}

function assertModeSuccess(body: LaravelEnvelope<ProfileModeSwitchData> | undefined, fallback: string): ProfileModeSwitchData {
  if (body?.success && body.data?.user) {
    return body.data
  }

  throw new Error(body?.message || fallback)
}

export async function switchToVendorMode(): Promise<ProfileModeSwitchData> {
  const response = await request.post<LaravelEnvelope<ProfileModeSwitchData>>('/user/mode/vendor')
  const result = assertModeSuccess(response.data, 'Could not create your business page. Please try again.')
  setStoredAuthUser(result.user)
  return result
}

/**
 * Vendor business show/update APIs require role=vendor.
 * Call this before create-extra / edit / update so user-role sessions do not get 403 Forbidden.
 */
export async function ensureVendorMode(currentUser?: AuthUser | null): Promise<AuthUser> {
  const known = currentUser ?? getStoredAuthUser()
  if (known?.role === 'vendor') {
    return known
  }

  const result = await switchToVendorMode()
  return result.user
}

/** @deprecated Customer mode switching is no longer supported. */
export async function switchToCustomerMode(): Promise<ProfileModeSwitchData> {
  const response = await request.post<LaravelEnvelope<ProfileModeSwitchData>>('/user/mode/customer')

  return assertModeSuccess(response.data, 'Could not switch to customer mode. Please try again.')
}

export function getProfileModeErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as LaravelEnvelope<unknown> | undefined
    if (data?.message) return data.message
  }

  if (error instanceof Error && error.message) return error.message
  return fallback
}
