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
  return { id, label }
}

export function parseLocationFilterList(raw: unknown): LocationFilterOption[] {
  if (!Array.isArray(raw)) return []
  return raw.map(parseLocationFilterOption).filter((x): x is LocationFilterOption => x !== null)
}
