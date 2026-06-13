import { isValidNigerianPhone, toNigerianPhonePayload } from '@/lib/nigerianPhone'
import { type VerificationChannel } from '@/features/auth/types'

export type ParsedAuthContact = {
  channel: VerificationChannel
  email?: string
  phone?: string
}

export function parseAuthContactInput(raw: string): ParsedAuthContact {
  const trimmed = raw.trim()
  if (!trimmed) {
    throw new Error('Enter your email address or phone number.')
  }

  if (trimmed.includes('@')) {
    const email = trimmed.toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Enter a valid email address or Nigerian phone number.')
    }
    return { channel: 'email', email }
  }

  if (isValidNigerianPhone(trimmed)) {
    return { channel: 'phone', phone: toNigerianPhonePayload(trimmed) }
  }

  throw new Error('Enter a valid email address or Nigerian phone number.')
}
