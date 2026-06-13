import { type AuthRole, type VerificationChannel } from '@/features/auth/types'

const STORAGE_KEY = 'device_verification_session'

export type DeviceVerificationSession = {
  token: string
  channel: VerificationChannel
  email?: string
  phone?: string
  role: AuthRole
}

export function saveDeviceVerificationSession(session: DeviceVerificationSession): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function getDeviceVerificationSession(): DeviceVerificationSession | null {
  if (typeof sessionStorage === 'undefined') return null

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<DeviceVerificationSession>
    if (!parsed.token || !parsed.channel || !parsed.role) {
      return null
    }
    return {
      token: parsed.token,
      channel: parsed.channel,
      email: parsed.email,
      phone: parsed.phone,
      role: parsed.role,
    }
  } catch {
    return null
  }
}

export function clearDeviceVerificationSession(): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEY)
}
