const STORAGE_KEY = 'gidira_password_reset_session'

export type PasswordResetSession = {
  email: string
  token: string
  otpVerified: boolean
}

export function savePasswordResetSession(partial: {
  email: string
  token: string
  otpVerified?: boolean
}): void {
  const existing = getPasswordResetSession()
  const next: PasswordResetSession = {
    email: partial.email.trim().toLowerCase(),
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
    const parsed = JSON.parse(raw) as Partial<PasswordResetSession>
    if (
      typeof parsed.email !== 'string' ||
      typeof parsed.token !== 'string' ||
      parsed.email.trim() === '' ||
      parsed.token.length !== 64
    ) {
      return null
    }
    return {
      email: parsed.email.trim().toLowerCase(),
      token: parsed.token,
      otpVerified: parsed.otpVerified === true,
    }
  } catch {
    return null
  }
}

export function clearPasswordResetSession(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
