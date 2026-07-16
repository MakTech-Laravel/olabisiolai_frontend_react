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
  imageUrls: string[]
  imagePaths: string[]
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

function parseStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((entry) => asString(entry).trim())
    .filter((entry) => entry.length > 0)
}

export function parseCatalogItem(raw: unknown): BusinessCatalogItem | null {
  const item = asRecord(raw)
  if (!item) return null

  const id = asNumber(item.id)
  if (id === null || id <= 0) return null

  const typeRaw = asString(item.type, 'service').toLowerCase()
  const type: CatalogItemType = typeRaw === 'product' ? 'product' : 'service'
  const imageUrls = parseStringList(item.image_urls)
  const imageUrl = asString(item.image_url).trim() || imageUrls[0] || null
  if (imageUrl && !imageUrls.includes(imageUrl)) {
    imageUrls.unshift(imageUrl)
  }

  return {
    id,
    type,
    name: asString(item.name).trim(),
    description: asString(item.description).trim() || null,
    priceKobo: asNumber(item.price_kobo),
    priceLabel: asString(item.price_label).trim() || null,
    priceFrom: asBoolean(item.price_from),
    imageUrl,
    imageUrls,
    imagePaths: parseStringList(item.image_paths),
    sortOrder: asNumber(item.sort_order) ?? 0,
  }
}

export function parseCatalogItems(raw: unknown): BusinessCatalogItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map(parseCatalogItem).filter((item): item is BusinessCatalogItem => item !== null)
}

function formatNairaFromKobo(priceKobo: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(priceKobo / 100)
}

/** Digits-only naira amount for the catalog price field (no currency symbols). */
export function sanitizeCatalogPriceDigits(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 12)
}

/** Prefill editor from stored kobo or a numeric-looking label. */
export function catalogPriceEditorValue(
  item: Pick<BusinessCatalogItem, 'priceKobo' | 'priceLabel'>,
): string {
  if (item.priceKobo !== null && item.priceKobo >= 0) {
    return String(Math.round(item.priceKobo / 100))
  }
  const digits = sanitizeCatalogPriceDigits(item.priceLabel ?? '')
  if (!digits) return ''
  const asNumber = Number(digits)
  return Number.isFinite(asNumber) ? String(asNumber) : digits
}

export function nairaDigitsToKobo(digits: string): number | null {
  const cleaned = sanitizeCatalogPriceDigits(digits)
  if (!cleaned) return null
  const naira = Number(cleaned)
  if (!Number.isFinite(naira) || naira < 0) return null
  return Math.round(naira * 100)
}

export function formatCatalogPrice(item: Pick<BusinessCatalogItem, 'priceKobo' | 'priceLabel' | 'priceFrom'>): string {
  if (item.priceKobo !== null && item.priceKobo >= 0) {
    const naira = formatNairaFromKobo(item.priceKobo)
    return item.priceFrom ? `from ${naira}` : naira
  }

  const label = item.priceLabel?.trim()
  if (label) {
    const digits = sanitizeCatalogPriceDigits(label)
    const hasNonNumericJunk = /[^\d\s₦,.]/.test(label)
    if (digits && !hasNonNumericJunk) {
      const kobo = nairaDigitsToKobo(digits)
      if (kobo !== null) {
        const naira = formatNairaFromKobo(kobo)
        return item.priceFrom ? `from ${naira}` : naira
      }
    }
    return item.priceFrom ? `from ${label}` : label
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
  /** Whole-naira amount as digits; converted to `price_kobo` on save. */
  priceLabel?: string
  priceKobo?: number | null
  priceFrom?: boolean
  images?: File[]
  /** @deprecated use `images` */
  image?: File | null
  keepImagePaths?: string[]
  removeImage?: boolean
}

function appendCatalogFormData(formData: FormData, input: CatalogItemInput, businessId?: number) {
  if (businessId) formData.append('business_id', String(businessId))
  formData.append('type', input.type)
  formData.append('name', input.name.trim())
  if (input.description?.trim()) formData.append('description', input.description.trim())

  const priceKobo =
    input.priceKobo !== undefined
      ? input.priceKobo
      : input.priceLabel !== undefined
        ? nairaDigitsToKobo(input.priceLabel)
        : undefined

  if (priceKobo !== undefined) {
    if (priceKobo === null) {
      formData.append('price_kobo', '')
    } else {
      formData.append('price_kobo', String(priceKobo))
    }
    // Clear free-text labels so cards always show a numeric price.
    formData.append('price_label', '')
  }

  formData.append('price_from', input.priceFrom ? '1' : '0')

  const files = [
    ...(input.images ?? []),
    ...(input.image ? [input.image] : []),
  ]

  files.forEach((file, index) => {
    formData.append('images[]', catalogImageFileForUpload(file, `${input.name.trim()}-${index + 1}`))
  })

  if (input.keepImagePaths) {
    input.keepImagePaths.forEach((path, index) => {
      formData.append(`keep_image_paths[${index}]`, path)
    })
  }

  if (input.removeImage) formData.append('remove_images', '1')
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
