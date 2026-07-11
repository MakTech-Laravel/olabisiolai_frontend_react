import { request } from '@/api/request'
import type { UserSettingsPayload } from '@/api/userSettings'

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

/** `POST /user/email` — set or update email and send verification OTP. */
export async function updateUserEmail(email: string): Promise<UserSettingsPayload> {
  const response = await request.post<ApiEnvelope<UserSettingsPayload>>('/user/email', { email })
  const body = response.data
  if (!body?.success || !body.data) {
    throw new Error(body?.message || 'Could not update email')
  }
  return body.data
}

/** `POST /user/email/for-purchase` — set email and mark it verified, no OTP required. */
export async function setUserEmailForPurchase(email: string): Promise<UserSettingsPayload> {
  const response = await request.post<ApiEnvelope<UserSettingsPayload>>('/user/email/for-purchase', { email })
  const body = response.data
  if (!body?.success || !body.data) {
    throw new Error(body?.message || 'Could not save email')
  }
  return body.data
}

/** `POST /user/email/verify-otp` — confirm email with 6-digit code. */
export async function verifyUserEmailOtp(code: string): Promise<UserSettingsPayload> {
  const response = await request.post<ApiEnvelope<UserSettingsPayload>>('/user/email/verify-otp', { code })
  const body = response.data
  if (!body?.success || !body.data) {
    throw new Error(body?.message || 'Could not verify email')
  }
  return body.data
}

/** `POST /user/email/resend-otp` — resend verification code to pending email. */
export async function resendUserEmailOtp(): Promise<string> {
  const response = await request.post<ApiEnvelope<null>>('/user/email/resend-otp')
  const body = response.data
  if (!body?.success) {
    throw new Error(body?.message || 'Could not resend verification code')
  }
  return body.message || 'Verification code sent.'
}

export type EmailVerificationProfile = {
  email?: string | null
  email_verified?: boolean
  email_verification_required?: boolean
  can_make_purchases?: boolean
}

export function profileNeedsEmailVerification(profile: EmailVerificationProfile | null | undefined): boolean {
  return Boolean(profile?.email_verification_required)
}

export function profileCanMakePurchases(profile: EmailVerificationProfile | null | undefined): boolean {
  if (profile?.can_make_purchases !== undefined) {
    return profile.can_make_purchases
  }
  if (!profile?.email) {
    return true
  }
  return Boolean(profile.email_verified)
}
