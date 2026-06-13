/** Normalize to Termii-style E.164 digits without + (e.g. 2348012345678). */
export function normalizeNigerianPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '')
  if (!digits) return null

  if (digits.startsWith('0') && digits.length === 11) {
    return `234${digits.slice(1)}`
  }

  if (digits.startsWith('234') && digits.length >= 13) {
    return digits
  }

  if (digits.length === 10) {
    return `234${digits}`
  }

  return digits.length >= 13 ? digits : null
}

export function isValidNigerianPhone(input: string): boolean {
  const normalized = normalizeNigerianPhone(input)
  return normalized !== null && /^234[789]\d{9}$/.test(normalized)
}

/** Human display: +234 812 345 6789 */
export function formatNigerianPhoneDisplay(phone: string): string {
  const trimmed = phone.trim()
  if (!trimmed) return ''

  const normalized = normalizeNigerianPhone(trimmed)
  if (!normalized || !/^234[789]\d{9}$/.test(normalized)) {
    return trimmed
  }

  const national = normalized.slice(3)
  return `+234 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`
}

/** API payload: normalized E.164 digits without +. */
export function toNigerianPhonePayload(input: string): string {
  return normalizeNigerianPhone(input) ?? input.trim()
}
