import type { BuyerCart } from '@/features/catalog/buyerCartApi'
import { BUSINESS_PROVIDES_TOTAL_PRICE } from '@/features/catalog/cartPricing'
import { formatNairaFromKobo } from '@/features/catalog/businessCatalogApi'

const CART_MARKER_OPEN = '[GIDIRA_CART]'
const CART_MARKER_CLOSE = '[/GIDIRA_CART]'

export type CartMessageItem = {
  id: number
  cartItemId?: number
  name: string
  qty: number
  priceDisplay: string
  lineTotalDisplay?: string
  originalLineTotalDisplay?: string
  hasDiscount?: boolean
  imageUrl: string | null
}

export type CartMessagePayload = {
  v: 1
  cartId?: number
  businessInfoId: number
  businessName: string
  sentAt: string
  estimatedTotalDisplay: string
  itemCount: number
  items: CartMessageItem[]
}

export type ParsedCartEnquiry = {
  cart: CartMessagePayload
  userText: string
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null
  return value as Record<string, unknown>
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

/** Normalize API snake_case or legacy camelCase cart marker payloads. */
export function normalizeCartMessagePayload(raw: unknown): CartMessagePayload | null {
  const cart = asRecord(raw)
  if (!cart) return null

  const businessName =
    asString(cart.businessName || cart.business_name).trim() || 'Business'
  const businessInfoId =
    asNumber(cart.businessInfoId ?? cart.business_info_id) ?? 0
  const itemsRaw = Array.isArray(cart.items) ? cart.items : []
  const items: CartMessageItem[] = []
  for (const entry of itemsRaw) {
    const line = asRecord(entry)
    if (!line) continue
    const id = asNumber(line.id ?? line.catalog_item_id)
    if (id === null) continue
    const qty = asNumber(line.qty ?? line.quantity) ?? 1
    const originalUnit = asNumber(
      line.originalUnitPriceKobo ?? line.original_unit_price_kobo,
    )
    const hasDiscount = Boolean(line.hasDiscount ?? line.has_discount)
    let originalLineTotalDisplay =
      asString(
        line.originalLineTotalDisplay ?? line.original_line_total_display,
      ).trim() || undefined
    if (!originalLineTotalDisplay && hasDiscount && originalUnit !== null && originalUnit > 0) {
      originalLineTotalDisplay = formatNairaFromKobo(originalUnit * qty)
    }

    items.push({
      id,
      cartItemId: asNumber(line.cartItemId ?? line.cart_item_id) ?? undefined,
      name: asString(line.name).trim() || 'Item',
      qty,
      priceDisplay: asString(line.priceDisplay ?? line.price_display),
      lineTotalDisplay:
        asString(line.lineTotalDisplay ?? line.line_total_display).trim() || undefined,
      originalLineTotalDisplay,
      hasDiscount,
      imageUrl: asString(line.imageUrl ?? line.image_url).trim() || null,
    })
  }

  if (!businessName || items.length === 0) return null

  const itemCount =
    asNumber(cart.itemCount ?? cart.item_count) ??
    items.reduce((sum, item) => sum + item.qty, 0)

  return {
    v: 1,
    cartId: asNumber(cart.cartId ?? cart.cart_id) ?? undefined,
    businessInfoId,
    businessName,
    sentAt: asString(cart.sentAt ?? cart.sent_at, new Date().toISOString()),
    estimatedTotalDisplay: asString(
      cart.estimatedTotalDisplay ?? cart.estimated_total_display,
      BUSINESS_PROVIDES_TOTAL_PRICE,
    ),
    itemCount,
    items,
  }
}

export function buildCartMessagePayloadFromBuyerCart(cart: BuyerCart): CartMessagePayload {
  return {
    v: 1,
    cartId: cart.id,
    businessInfoId: cart.businessInfoId,
    businessName: cart.businessName,
    sentAt: cart.sentAt ?? new Date().toISOString(),
    estimatedTotalDisplay: cart.estimatedTotalDisplay,
    itemCount: cart.itemCount,
    items: cart.items.map((line) => {
      const hasDiscount =
        line.hasDiscount &&
        line.originalUnitPriceKobo !== null &&
        line.originalUnitPriceKobo > 0 &&
        line.unitPriceKobo !== null &&
        line.originalUnitPriceKobo > line.unitPriceKobo

      return {
        id: line.catalogItemId,
        cartItemId: line.id,
        name: line.name,
        qty: line.quantity,
        priceDisplay: line.priceDisplay,
        lineTotalDisplay: line.lineTotalDisplay || undefined,
        hasDiscount,
        originalLineTotalDisplay: hasDiscount
          ? formatNairaFromKobo(line.originalUnitPriceKobo! * line.quantity)
          : undefined,
        imageUrl: line.imageUrl,
      }
    }),
  }
}

export function buildCartEnquiryBody(
  cart: CartMessagePayload,
  userText = '',
): string {
  const marker = `${CART_MARKER_OPEN}${JSON.stringify(cart)}${CART_MARKER_CLOSE}`
  const trimmed = userText.trim()
  return trimmed ? `${marker}\n\n${trimmed}` : marker
}

export function parseCartEnquiryBody(body: string | null | undefined): ParsedCartEnquiry | null {
  if (!body?.includes(CART_MARKER_OPEN)) return null

  const start = body.indexOf(CART_MARKER_OPEN)
  const end = body.indexOf(CART_MARKER_CLOSE, start)
  if (start === -1 || end === -1) return null

  const jsonRaw = body.slice(start + CART_MARKER_OPEN.length, end)
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonRaw)
  } catch {
    return null
  }

  const cart = normalizeCartMessagePayload(parsed)
  if (!cart) return null

  const after = body.slice(end + CART_MARKER_CLOSE.length).trim()
  const userText = after.startsWith('\n\n') ? after.slice(2).trim() : after

  return { cart, userText }
}

export function cartEnquiryPreviewText(body: string | null | undefined): string | null {
  const parsed = parseCartEnquiryBody(body)
  if (!parsed) return null
  const count = parsed.cart.itemCount
  const prefix = `Cart: ${count} item${count === 1 ? '' : 's'}`
  return parsed.userText ? `${prefix} — ${parsed.userText}` : prefix
}
