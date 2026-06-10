import { isAxiosError } from 'axios'

import type { AuthUser } from '@/auth/types'
import type { VerificationChannel } from '@/features/auth/types'

type UserWithSettings = AuthUser & {
  settings?: Record<string, unknown>
  account_verified?: boolean
  verification_channel?: VerificationChannel | null
}

export function isAccountUnverifiedError(error: unknown): boolean {
  if (!isAxiosError(error) || error.response?.status !== 403) {
    return false
  }

  const data = error.response.data
  if (!data || typeof data !== 'object') {
    return false
  }

  return (data as Record<string, unknown>).verification_status === 'unverified'
}

export function isUserAccountVerified(user: AuthUser | null | undefined): boolean {
  if (!user) {
    return true
  }

  const extended = user as UserWithSettings
  if (extended.account_verified === false) {
    return false
  }

  if (extended.account_verified === true) {
    return true
  }

  if (user.email_verified_at || user.phone_verified_at) {
    return true
  }

  if (user.email_verified) {
    return true
  }

  return false
}

export function resolveRegistrationVerificationChannel(
  user: AuthUser | null | undefined,
): VerificationChannel {
  const extended = user as UserWithSettings | null | undefined
  const stored = extended?.settings?.registration_verification_channel
  if (stored === 'phone' || stored === 'email') {
    return stored
  }

  if (extended?.verification_channel === 'phone' || extended?.verification_channel === 'email') {
    return extended.verification_channel
  }

  if (user?.phone && !user.email) {
    return 'phone'
  }

  return 'email'
}

export function accountVerificationDestination(
  user: AuthUser | null | undefined,
  channel: VerificationChannel,
): string {
  const params = new URLSearchParams({
    purpose: 'register',
    channel,
    role: user?.role === 'vendor' ? 'vendor' : 'user',
  })

  if (channel === 'phone' && user?.phone) {
    params.set('phone', user.phone)
  } else if (user?.email) {
    params.set('email', user.email)
  }

  return `/otp-verification?${params.toString()}`
}
