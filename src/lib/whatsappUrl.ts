import { formatNigerianPhoneDisplay, normalizeNigerianPhone } from '@/lib/nigerianPhone'

/** Prefer dedicated WhatsApp number; fall back to business phone. */
export function resolveBusinessContactPhone(
  whatsapp?: string | null,
  phone?: string | null,
): string | null {
  const w = (whatsapp ?? '').trim();
  if (w) return w;
  const p = (phone ?? '').trim();
  return p || null;
}

/** Build a WhatsApp chat URL from a phone number (digits only in path). */
export function buildWhatsAppUrl(phone: string | null | undefined): string | null {
  const digits = phone ? phoneDigitsForUrl(phone) : ''
  if (!digits) return null
  return `https://wa.me/${digits}`
}

export function buildBusinessWhatsAppUrl(
  whatsapp?: string | null,
  phone?: string | null,
): string | null {
  return buildWhatsAppUrl(resolveBusinessContactPhone(whatsapp, phone));
}

/** Human-readable label for revealed phone UI (+234 812 345 6789). */
export function formatPhoneDisplay(phone: string): string {
  return formatNigerianPhoneDisplay(phone)
}

/** Digits-only string suitable for wa.me links. */
export function phoneDigitsForUrl(phone: string): string {
  return normalizeNigerianPhone(phone) ?? phone.replace(/\D/g, '')
}
