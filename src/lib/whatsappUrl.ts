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
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

export function buildBusinessWhatsAppUrl(
  whatsapp?: string | null,
  phone?: string | null,
): string | null {
  return buildWhatsAppUrl(resolveBusinessContactPhone(whatsapp, phone));
}

/** Human-readable label for revealed phone UI. */
export function formatPhoneDisplay(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('+') || /\s/.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return trimmed;
  return `+${digits}`;
}
