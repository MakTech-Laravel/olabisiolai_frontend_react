import { request } from '@/api/request'
import {
  parseCatalogItem,
  type BusinessCatalogItem,
  type CatalogItemType,
} from '@/features/catalog/businessCatalogApi'

export type DiscoveryCatalogItem = BusinessCatalogItem & {
  businessInfoId: number
  businessName: string
  categoryId: number | null
  categoryName: string | null
  locationLabel: string | null
  cityName: string | null
  vendorUserUuid: string | null
  isBoosted: boolean
  isPremium: boolean
}

export type DiscoveryCatalogFeed = {
  items: DiscoveryCatalogItem[]
  count: number
  pagination: {
    current_page: number
    per_page: number
    last_page: number
    total: number
  }
}

type RawRecord = Record<string, unknown>

function asRecord(value: unknown): RawRecord | null {
  if (!value || typeof value !== 'object') return null
  return value as RawRecord
}

function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return fallback
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function asBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === '1'
}

export function parseDiscoveryCatalogItem(raw: unknown): DiscoveryCatalogItem | null {
  const base = parseCatalogItem(raw)
  const item = asRecord(raw)
  if (!base || !item) return null

  const businessInfoId = asNumber(item.business_info_id)
  if (businessInfoId === null || businessInfoId <= 0) return null

  return {
    ...base,
    businessInfoId,
    businessName: asString(item.business_name, 'Business').trim() || 'Business',
    categoryId: asNumber(item.category_id),
    categoryName: asString(item.category_name).trim() || null,
    locationLabel: asString(item.location_label).trim() || null,
    cityName: asString(item.city_name).trim() || null,
    vendorUserUuid: asString(item.vendor_user_uuid).trim() || null,
    isBoosted: asBoolean(item.is_boosted),
    isPremium: item.is_premium === undefined ? true : asBoolean(item.is_premium),
  }
}

function parseDiscoveryList(raw: unknown): DiscoveryCatalogItem[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(parseDiscoveryCatalogItem)
    .filter((item): item is DiscoveryCatalogItem => item !== null)
}

export async function fetchHomeCatalogItems(limit = 8): Promise<DiscoveryCatalogItem[]> {
  const res = await request.get('/catalog/home', { params: { limit } })
  const root = asRecord(res.data)
  const data = asRecord(root?.data)
  return parseDiscoveryList(data?.items)
}

export async function fetchCatalogDiscoveryFeed(params: {
  page?: number
  per_page?: number
  category_id?: number
  city?: string
  type?: CatalogItemType | 'all'
  search?: string
} = {}): Promise<DiscoveryCatalogFeed> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    per_page: params.per_page ?? 24,
  }
  if (params.category_id && params.category_id > 0) query.category_id = params.category_id
  if (params.city?.trim()) query.city = params.city.trim()
  if (params.type && params.type !== 'all') query.type = params.type
  if (params.search?.trim()) query.search = params.search.trim()

  const res = await request.get('/catalog', { params: query })
  const root = asRecord(res.data)
  const data = asRecord(root?.data)
  const pagination = asRecord(data?.pagination)

  return {
    items: parseDiscoveryList(data?.items),
    count: asNumber(data?.count) ?? 0,
    pagination: {
      current_page: Math.max(1, asNumber(pagination?.current_page) ?? 1),
      per_page: Math.max(1, asNumber(pagination?.per_page) ?? 24),
      last_page: Math.max(1, asNumber(pagination?.last_page) ?? 1),
      total: Math.max(0, asNumber(pagination?.total) ?? 0),
    },
  }
}
