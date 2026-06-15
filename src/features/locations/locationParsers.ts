import type { LocationFilterOption } from '@/features/locations/types'

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null
  return value as Record<string, unknown>
}

export function parseLocationFilterOption(raw: unknown): LocationFilterOption | null {
  const o = asRecord(raw)
  if (!o) return null
  const id = typeof o.id === 'number' ? o.id : Number(o.id)
  if (!Number.isFinite(id) || id <= 0) return null
  const label = typeof o.label === 'string' ? o.label.trim() : ''
  if (!label) return null
  const stateName =
    typeof o.state_name === 'string'
      ? o.state_name.trim()
      : typeof o.stateName === 'string'
        ? o.stateName.trim()
        : ''
  const cityName =
    typeof o.city_name === 'string'
      ? o.city_name.trim()
      : typeof o.cityName === 'string'
        ? o.cityName.trim()
        : ''
  const lgaName =
    typeof o.lga_name === 'string'
      ? o.lga_name.trim()
      : typeof o.lgaName === 'string'
        ? o.lgaName.trim()
        : ''
  return { id, label, stateName, cityName, lgaName }
}

export function parseLocationFilterList(raw: unknown): LocationFilterOption[] {
  if (!Array.isArray(raw)) return []
  return raw.map(parseLocationFilterOption).filter((x): x is LocationFilterOption => x !== null)
}
