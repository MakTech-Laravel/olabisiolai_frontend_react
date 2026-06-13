const STORAGE_KEY = 'gidira_password_reset_session'

import { type VerificationChannel } from '@/features/auth/types'

export type PasswordResetSession = {
  channel: VerificationChannel
  email?: string
  phone?: string
  token: string
  otpVerified: boolean
}

export function savePasswordResetSession(partial: {
  channel: VerificationChannel
  email?: string
  phone?: string
  token: string
  otpVerified?: boolean
}): void {
  const existing = getPasswordResetSession()
  const next: PasswordResetSession = {
    channel: partial.channel,
    email: partial.email?.trim().toLowerCase(),
    phone: partial.phone?.trim(),
    token: partial.token,
    otpVerified: partial.otpVerified ?? existing?.otpVerified ?? false,
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function markPasswordResetOtpVerified(): void {
  const session = getPasswordResetSession()
  if (!session) return
  savePasswordResetSession({ ...session, otpVerified: true })
}

export function getPasswordResetSession(): PasswordResetSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PasswordResetSession> & { email?: string }
    if (typeof parsed.token !== 'string' || parsed.token.length !== 64) {
      return null
    }

    const channel: VerificationChannel =
      parsed.channel === 'phone' ? 'phone' : parsed.email ? 'email' : 'email'

    if (channel === 'phone') {
      if (typeof parsed.phone !== 'string' || parsed.phone.trim() === '') {
        return null
      }
    } else if (typeof parsed.email !== 'string' || parsed.email.trim() === '') {
      return null
    }

    return {
      channel,
      email: parsed.email?.trim().toLowerCase(),
      phone: parsed.phone?.trim(),
      token: parsed.token,
      otpVerified: parsed.otpVerified === true,
    }
  } catch {
    return null
  }
}

export function buildPasswordResetOtpPath(session: PasswordResetSession): string {
  const params = new URLSearchParams({
    purpose: 'reset',
    channel: session.channel,
  })
  if (session.channel === 'phone' && session.phone) {
    params.set('phone', session.phone)
  } else if (session.email) {
    params.set('email', session.email)
  }
  return `/otp-verification?${params.toString()}`
}

export function passwordResetContactPayload(session: PasswordResetSession): {
  email?: string
  phone?: string
} {
  if (session.channel === 'phone' && session.phone) {
    return { phone: session.phone }
  }
  if (session.email) {
    return { email: session.email }
  }
  return {}
}

export function clearPasswordResetSession(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
