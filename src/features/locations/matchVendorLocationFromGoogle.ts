import type { LgaMapPickResult } from '@/features/maps/lgaMapPickTypes'
import type { ParsedLocationOption } from '@/features/locations/vendorLocationOptions'

function normalizeName(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\blga\b/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function scoreLocationMatch(
  entry: ParsedLocationOption,
  state: string,
  lga: string,
  city: string,
): number {
  const entryState = normalizeName(entry.state)
  const entryLga = normalizeName(entry.lga)
  const entryCity = normalizeName(entry.city)

  if (state && entryState !== state) return 0

  let score = state && entryState === state ? 2 : 1

  if (lga && entryLga === lga) score += 5
  else if (lga && (entryLga.includes(lga) || lga.includes(entryLga))) score += 3

  if (city && entryCity === city) score += 4
  else if (city && (entryCity.includes(city) || city.includes(entryCity))) score += 2

  if (lga && entryCity === lga) score += 2

  return score
}

export function matchVendorLocationFromGoogle(
  pick: LgaMapPickResult,
  locations: ParsedLocationOption[],
): ParsedLocationOption | null {
  if (locations.length === 0) return null

  const state = normalizeName(pick.administrativeAreaLevel1)
  const lga = normalizeName(pick.administrativeAreaLevel2)
  const city = normalizeName(pick.locality)

  let best: ParsedLocationOption | null = null
  let bestScore = 0

  for (const entry of locations) {
    const score = scoreLocationMatch(entry, state, lga, city)
    if (score > bestScore) {
      bestScore = score
      best = entry
    }
  }

  if (best && bestScore >= 3) {
    return best
  }

  if (state) {
    const inState = locations.filter((entry) => normalizeName(entry.state) === state)
    if (inState.length === 1) {
      return inState[0]
    }
  }

  return bestScore > 0 ? best : null
}
