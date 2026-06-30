import { type AuthRole, type VerificationChannel } from '@/features/auth/types'

const STORAGE_KEY = 'two_factor_login_session'

export type TwoFactorLoginSession = {
  token: string
  role: AuthRole | 'admin'
  verificationChannel: VerificationChannel
  maskedEmail?: string
  maskedPhone?: string
}

export function saveTwoFactorLoginSession(session: TwoFactorLoginSession): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function getTwoFactorLoginSession(): TwoFactorLoginSession | null {
  if (typeof sessionStorage === 'undefined') return null

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<TwoFactorLoginSession>
    if (!parsed.token || !parsed.role) {
      return null
    }
    return {
      token: parsed.token,
      role: parsed.role,
      verificationChannel: parsed.verificationChannel === 'phone' ? 'phone' : 'email',
      maskedEmail: parsed.maskedEmail,
      maskedPhone: parsed.maskedPhone,
    }
  } catch {
    return null
  }
}

export function clearTwoFactorLoginSession(): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEY)
}
