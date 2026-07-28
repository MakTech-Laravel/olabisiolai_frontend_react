import { request } from '@/api/request'
import { catalogImageFileForUpload } from '@/features/catalog/catalogMessageContext'

export type CatalogItemType = 'product' | 'service'

export const CATALOG_NAME_MAX_LENGTH = 120
export const CATALOG_DESCRIPTION_MAX_LENGTH = 500
export const CATALOG_PRICE_LABEL_MAX_LENGTH = 64

export type CatalogDiscountType = 'percent' | 'flat'

export type BusinessCatalogItem = {
  id: number
  type: CatalogItemType
  name: string
  description: string | null
  /** Payable / sale amount in kobo (list price when no discount). */
  priceKobo: number | null
  /** List price in kobo when discounted (strikethrough). */
  originalPriceKobo: number | null
  priceLabel: string | null
  priceFrom: boolean
  discountType: CatalogDiscountType | null
  discountValue: number | null
  hasDiscount: boolean
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
    originalPriceKobo: asNumber(item.original_price_kobo),
    priceLabel: asString(item.price_label).trim() || null,
    priceFrom: asBoolean(item.price_from),
    discountType:
      asString(item.discount_type).toLowerCase() === 'flat'
        ? 'flat'
        : asString(item.discount_type).toLowerCase() === 'percent'
          ? 'percent'
          : null,
    discountValue: asNumber(item.discount_value),
    hasDiscount: asBoolean(item.has_discount),
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

export function formatNairaFromKobo(priceKobo: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(priceKobo / 100)
}

/** Digits-only naira amount for exact catalog prices (no currency symbols). */
export function sanitizeCatalogPriceDigits(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 12)
}

/** True when the price field is a single numeric naira amount (not a range/label). */
export function isExactNairaPriceInput(raw: string): boolean {
  const trimmed = raw.trim()
  if (!trimmed) return false
  // Ranges / words like "from 1500 - 2000" are free-text labels, not exact kobo.
  if (/[^\d\s₦,.]/.test(trimmed)) return false
  return Boolean(sanitizeCatalogPriceDigits(trimmed))
}

/** Prefill editor from list price (original when discounted) or free-text label. */
export function catalogPriceEditorValue(
  item: Pick<BusinessCatalogItem, 'priceKobo' | 'originalPriceKobo' | 'priceLabel' | 'hasDiscount'>,
): string {
  const listKobo =
    item.hasDiscount && item.originalPriceKobo !== null && item.originalPriceKobo >= 0
      ? item.originalPriceKobo
      : item.priceKobo
  if (listKobo !== null && listKobo >= 0) {
    return String(Math.round(listKobo / 100))
  }
  return (item.priceLabel ?? '').trim()
}

export function nairaDigitsToKobo(digits: string): number | null {
  const cleaned = sanitizeCatalogPriceDigits(digits)
  if (!cleaned) return null
  const naira = Number(cleaned)
  if (!Number.isFinite(naira) || naira < 0) return null
  return Math.round(naira * 100)
}

/** Client-side preview of sale kobo from list + discount (matches backend CatalogPricing). */
export function computeSalePriceKobo(
  listKobo: number,
  type: CatalogDiscountType,
  value: number,
): number | null {
  if (listKobo < 0 || value < 1) return null
  if (type === 'percent') {
    if (value > 100) return null
    return Math.round((listKobo * (100 - value)) / 100)
  }
  if (value > listKobo) return null
  return Math.max(0, listKobo - value)
}

export function formatCatalogPrice(
  item: Pick<BusinessCatalogItem, 'priceKobo' | 'priceLabel' | 'priceFrom'>,
): string {
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
  /** Whole-naira amount as digits, or free-text / range for `price_label`. */
  priceLabel?: string
  /** Exact list/base amount in kobo; null for range/text or price-on-request. */
  priceKobo?: number | null
  priceFrom?: boolean
  discountType?: CatalogDiscountType | null
  discountValue?: number | null
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

  const rawLabel = (input.priceLabel ?? '').trim()
  let priceKobo: number | null | undefined = input.priceKobo
  let priceLabel = ''

  if (priceKobo === undefined && input.priceLabel !== undefined) {
    if (!rawLabel) {
      priceKobo = null
      priceLabel = ''
    } else if (isExactNairaPriceInput(rawLabel)) {
      priceKobo = nairaDigitsToKobo(rawLabel)
      priceLabel = ''
    } else {
      // Range / free-text (e.g. "from 1500 - 2000") — cart will not show an exact total.
      priceKobo = null
      priceLabel = rawLabel.slice(0, 64)
    }
  } else if (priceKobo !== undefined) {
    priceLabel = rawLabel && !isExactNairaPriceInput(rawLabel) ? rawLabel.slice(0, 64) : ''
  }

  if (priceKobo !== undefined) {
    formData.append('price_kobo', priceKobo === null ? '' : String(priceKobo))
    formData.append('price_label', priceLabel)
  }

  formData.append('price_from', input.priceFrom ? '1' : '0')

  if (input.discountType !== undefined) {
    formData.append('discount_type', input.discountType ?? '')
  }
  if (input.discountValue !== undefined) {
    formData.append(
      'discount_value',
      input.discountValue === null ? '' : String(input.discountValue),
    )
  }

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
