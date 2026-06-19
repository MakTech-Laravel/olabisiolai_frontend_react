import type { LgaMapPickResult } from '@/features/maps/lgaMapPickTypes'

export type BusinessLocationAreaParts = {
  city?: string | null
  state?: string | null
  lga?: string | null
  fullName?: string | null
}

/** Human-readable area label from a Google pick (e.g. "Yaba, Lagos"). */
export function areaLabelFromPick(pick: LgaMapPickResult): string {
  const locality = pick.locality?.trim() || pick.administrativeAreaLevel2?.trim() || ''
  const state = pick.administrativeAreaLevel1?.trim() || ''
  if (locality && state) return `${locality}, ${state}`
  return pick.formattedAddress?.trim() || locality || state || 'Your area'
}

export function areaLabelFromParts(parts: BusinessLocationAreaParts): string {
  const city = parts.city?.trim() || ''
  const state = parts.state?.trim() || ''
  if (city && state) return `${city}, ${state}`
  return parts.fullName?.trim() || city || state || parts.lga?.trim() || ''
}

/** Combined public display: "Yaba, Lagos - Inside Tejuosho Market, Block B". */
export function formatBusinessLocationDisplay(
  areaName: string,
  narrative?: string | null,
): string {
  const area = areaName.trim()
  const note = narrative?.trim() || ''
  if (area && note) return `${area} - ${note}`
  return area || note
}

export function formatBusinessLocationFromParts(
  parts: BusinessLocationAreaParts,
  narrative?: string | null,
): string {
  return formatBusinessLocationDisplay(areaLabelFromParts(parts), narrative)
}
