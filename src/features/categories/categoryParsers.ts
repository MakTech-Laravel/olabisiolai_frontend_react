import type { CategoryDto } from '@/features/categories/types'

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null
  return value as Record<string, unknown>
}

export function normalizeSubcategories(raw: unknown): string[] {
  if (raw === null || raw === undefined) return []
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === 'string' ? item.trim() : String(item)))
      .filter(Boolean)
  }
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

export function parseCategoryDto(raw: unknown): CategoryDto | null {
  const o = asRecord(raw)
  if (!o) return null
  const id = typeof o.id === 'number' ? o.id : Number(o.id)
  if (!Number.isFinite(id)) return null
  const name = typeof o.name === 'string' ? o.name.trim() : ''
  if (!name) return null
  return {
    id,
    name,
    subcategories: normalizeSubcategories(o.subcategories),
    subcategories_count:
      typeof o.subcategories_count === 'number' ? o.subcategories_count : undefined,
    created_at: typeof o.created_at === 'string' ? o.created_at : null,
    updated_at: typeof o.updated_at === 'string' ? o.updated_at : null,
  }
}

export function parseCategoryList(raw: unknown): CategoryDto[] {
  if (!Array.isArray(raw)) return []
  return raw.map(parseCategoryDto).filter((c): c is CategoryDto => c !== null)
}

export function laravelInnerData(body: unknown): Record<string, unknown> | null {
  const root = asRecord(body)
  if (!root) return null
  const data = root.data
  if (!data || typeof data !== 'object') return null
  return data as Record<string, unknown>
}
