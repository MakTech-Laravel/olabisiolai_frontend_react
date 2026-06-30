import { request } from '@/api/request'
import { catalogImageFileForUpload } from '@/features/catalog/catalogMessageContext'

export type CatalogItemType = 'product' | 'service'

export const CATALOG_NAME_MAX_LENGTH = 120
export const CATALOG_DESCRIPTION_MAX_LENGTH = 500
export const CATALOG_PRICE_LABEL_MAX_LENGTH = 64

export type BusinessCatalogItem = {
  id: number
  type: CatalogItemType
  name: string
  description: string | null
  priceKobo: number | null
  priceLabel: string | null
  priceFrom: boolean
  imageUrl: string | null
  sortOrder: number
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

export function parseCatalogItem(raw: unknown): BusinessCatalogItem | null {
  const item = asRecord(raw)
  if (!item) return null

  const id = asNumber(item.id)
  if (id === null || id <= 0) return null

  const typeRaw = asString(item.type, 'service').toLowerCase()
  const type: CatalogItemType = typeRaw === 'product' ? 'product' : 'service'

  return {
    id,
    type,
    name: asString(item.name).trim(),
    description: asString(item.description).trim() || null,
    priceKobo: asNumber(item.price_kobo),
    priceLabel: asString(item.price_label).trim() || null,
    priceFrom: asBoolean(item.price_from),
    imageUrl: asString(item.image_url).trim() || null,
    sortOrder: asNumber(item.sort_order) ?? 0,
  }
}

export function parseCatalogItems(raw: unknown): BusinessCatalogItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map(parseCatalogItem).filter((item): item is BusinessCatalogItem => item !== null)
}

export function formatCatalogPrice(item: Pick<BusinessCatalogItem, 'priceKobo' | 'priceLabel' | 'priceFrom'>): string {
  if (item.priceLabel?.trim()) {
    return item.priceFrom ? `from ${item.priceLabel}` : item.priceLabel
  }

  if (item.priceKobo !== null && item.priceKobo >= 0) {
    const naira = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(item.priceKobo / 100)
    return item.priceFrom ? `from ${naira}` : naira
  }

  return 'Price on request'
}

export type VendorCatalogResponse = {
  items: BusinessCatalogItem[]
  catalogLocked: boolean
}

export async function fetchVendorCatalog(businessId?: number): Promise<VendorCatalogResponse> {
  const res = await request.get('/vendor/catalog', {
    params: businessId ? { business_id: businessId } : undefined,
  })
  const root = asRecord(res.data)
  const data = asRecord(root?.data)

  return {
    items: parseCatalogItems(data?.items),
    catalogLocked: asBoolean(data?.catalog_locked),
  }
}

export type CatalogItemInput = {
  type: CatalogItemType
  name: string
  description?: string
  priceLabel?: string
  priceFrom?: boolean
  image?: File | null
  removeImage?: boolean
}

function appendCatalogFormData(formData: FormData, input: CatalogItemInput, businessId?: number) {
  if (businessId) formData.append('business_id', String(businessId))
  formData.append('type', input.type)
  formData.append('name', input.name.trim())
  if (input.description?.trim()) formData.append('description', input.description.trim())
  if (input.priceLabel?.trim()) formData.append('price_label', input.priceLabel.trim())
  formData.append('price_from', input.priceFrom ? '1' : '0')
  if (input.image) {
    formData.append('image', catalogImageFileForUpload(input.image, input.name.trim()))
  }
  if (input.removeImage) formData.append('remove_image', '1')
}

export async function createCatalogItem(input: CatalogItemInput, businessId?: number): Promise<BusinessCatalogItem> {
  const formData = new FormData()
  appendCatalogFormData(formData, input, businessId)

  const res = await request.post('/vendor/catalog', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  const root = asRecord(res.data)
  const data = asRecord(root?.data)
  const item = parseCatalogItem(data?.item)
  if (!item) throw new Error('Catalog item could not be saved.')
  return item
}

export async function updateCatalogItem(
  itemId: number,
  input: CatalogItemInput,
  businessId?: number,
): Promise<BusinessCatalogItem> {
  const formData = new FormData()
  appendCatalogFormData(formData, input, businessId)

  const res = await request.post(`/vendor/catalog/${itemId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  const root = asRecord(res.data)
  const data = asRecord(root?.data)
  const item = parseCatalogItem(data?.item)
  if (!item) throw new Error('Catalog item could not be updated.')
  return item
}

export async function deleteCatalogItem(itemId: number, businessId?: number): Promise<void> {
  await request.delete(`/vendor/catalog/${itemId}`, {
    params: businessId ? { business_id: businessId } : undefined,
  })
}
