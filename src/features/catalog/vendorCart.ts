import {
  CATALOG_CART_MAX_QTY,
} from '@/constants/config'
import {
  formatCatalogPrice,
  type BusinessCatalogItem,
} from '@/features/catalog/businessCatalogApi'

export type VendorCartLine = {
  catalogItemId: number
  qty: number
  name: string
  imageUrl: string | null
  /** Unit price in kobo when known; null for label-only / from prices. */
  unitPriceKobo: number | null
  priceDisplay: string
  priceFrom: boolean
}

export type VendorCart = {
  businessInfoId: number
  businessName: string
  vendorUserUuid: string | null
  updatedAt: string
  items: VendorCartLine[]
}

function storageKey(businessInfoId: number): string {
  return `gidira.vendorCart.${businessInfoId}`
}

export function loadVendorCart(businessInfoId: number): VendorCart | null {
  if (!Number.isFinite(businessInfoId) || businessInfoId <= 0) return null
  try {
    const raw = localStorage.getItem(storageKey(businessInfoId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as VendorCart
    if (!parsed || parsed.businessInfoId !== businessInfoId || !Array.isArray(parsed.items)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveVendorCart(cart: VendorCart): void {
  try {
    localStorage.setItem(storageKey(cart.businessInfoId), JSON.stringify(cart))
    window.dispatchEvent(
      new CustomEvent('gidira:vendor-cart', { detail: { businessInfoId: cart.businessInfoId } }),
    )
  } catch {
    // ignore quota / private mode
  }
}

export function clearVendorCart(businessInfoId: number): void {
  try {
    localStorage.removeItem(storageKey(businessInfoId))
    window.dispatchEvent(
      new CustomEvent('gidira:vendor-cart', { detail: { businessInfoId } }),
    )
  } catch {
    // ignore
  }
}

function emptyCart(
  businessInfoId: number,
  businessName: string,
  vendorUserUuid: string | null,
): VendorCart {
  return {
    businessInfoId,
    businessName,
    vendorUserUuid,
    updatedAt: new Date().toISOString(),
    items: [],
  }
}

function clampQty(qty: number): number {
  if (!Number.isFinite(qty) || qty < 1) return 1
  return Math.min(CATALOG_CART_MAX_QTY, Math.floor(qty))
}

function exactCartPriceDisplay(item: BusinessCatalogItem): string {
  if (item.priceKobo !== null && item.priceKobo >= 0) {
    return formatNairaFromKobo(item.priceKobo)
  }
  return formatCatalogPrice(item)
}

function lineFromItem(item: BusinessCatalogItem, qty: number): VendorCartLine {
  return {
    catalogItemId: item.id,
    qty: clampQty(qty),
    name: item.name,
    imageUrl: item.imageUrl,
    unitPriceKobo: item.priceKobo !== null && item.priceKobo >= 0 ? item.priceKobo : null,
    priceDisplay: exactCartPriceDisplay(item),
    priceFrom: item.priceFrom,
  }
}

export function addItemToVendorCart(
  businessInfoId: number,
  businessName: string,
  vendorUserUuid: string | null,
  item: BusinessCatalogItem,
  qtyDelta = 1,
): VendorCart {
  const existing = loadVendorCart(businessInfoId) ?? emptyCart(businessInfoId, businessName, vendorUserUuid)
  const nextItems = [...existing.items]
  const index = nextItems.findIndex((line) => line.catalogItemId === item.id)

  if (index >= 0) {
    nextItems[index] = {
      ...nextItems[index],
      qty: clampQty(nextItems[index].qty + qtyDelta),
      name: item.name,
      imageUrl: item.imageUrl,
      unitPriceKobo:
        item.priceKobo !== null && item.priceKobo >= 0
          ? item.priceKobo
          : nextItems[index].unitPriceKobo,
      priceDisplay: exactCartPriceDisplay(item),
      priceFrom: item.priceFrom,
    }
  } else {
    nextItems.push(lineFromItem(item, qtyDelta))
  }

  const cart: VendorCart = {
    businessInfoId,
    businessName: businessName.trim() || existing.businessName,
    vendorUserUuid: vendorUserUuid ?? existing.vendorUserUuid,
    updatedAt: new Date().toISOString(),
    items: nextItems,
  }
  saveVendorCart(cart)
  return cart
}

export function setVendorCartLineQty(
  businessInfoId: number,
  catalogItemId: number,
  qty: number,
): VendorCart | null {
  const existing = loadVendorCart(businessInfoId)
  if (!existing) return null

  let nextItems = [...existing.items]
  if (qty < 1) {
    nextItems = nextItems.filter((line) => line.catalogItemId !== catalogItemId)
  } else {
    const index = nextItems.findIndex((line) => line.catalogItemId === catalogItemId)
    if (index < 0) return existing
    nextItems[index] = { ...nextItems[index], qty: clampQty(qty) }
  }

  const cart: VendorCart = {
    ...existing,
    updatedAt: new Date().toISOString(),
    items: nextItems,
  }
  if (cart.items.length === 0) {
    clearVendorCart(businessInfoId)
    return { ...cart, items: [] }
  }
  saveVendorCart(cart)
  return cart
}

export function removeVendorCartLine(
  businessInfoId: number,
  catalogItemId: number,
): VendorCart | null {
  return setVendorCartLineQty(businessInfoId, catalogItemId, 0)
}

export function vendorCartItemCount(cart: VendorCart | null | undefined): number {
  if (!cart?.items.length) return 0
  return cart.items.reduce((sum, line) => sum + line.qty, 0)
}

/** Sum of unitPriceKobo * qty when every line has a numeric unit price; otherwise null. */
export function vendorCartEstimatedTotalKobo(cart: VendorCart | null | undefined): number | null {
  if (!cart?.items.length) return 0
  let total = 0
  for (const line of cart.items) {
    if (line.unitPriceKobo === null || line.unitPriceKobo < 0) {
      return null
    }
    total += line.unitPriceKobo * line.qty
  }
  return total
}

export function formatNairaFromKobo(priceKobo: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(priceKobo / 100)
}

export function formatVendorCartEstimatedTotal(cart: VendorCart | null | undefined): string {
  const total = vendorCartEstimatedTotalKobo(cart)
  if (total === null) return 'Price on request'
  return formatNairaFromKobo(total)
}

export function getVendorCartLineQty(
  cart: VendorCart | null | undefined,
  catalogItemId: number,
): number {
  return cart?.items.find((line) => line.catalogItemId === catalogItemId)?.qty ?? 0
}
