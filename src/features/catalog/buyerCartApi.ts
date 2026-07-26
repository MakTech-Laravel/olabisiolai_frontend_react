import { request } from '@/api/request'

export type BuyerCartLine = {
  id: number
  catalogItemId: number
  name: string
  quantity: number
  unitPriceKobo: number | null
  priceDisplay: string
  priceFrom: boolean
  lineTotalKobo: number | null
  lineTotalDisplay: string
  imageUrl: string | null
}

export type BuyerCart = {
  id: number
  status: 'open' | 'sent' | string
  businessInfoId: number
  businessName: string
  vendorUserUuid: string | null
  itemCount: number
  estimatedTotalKobo: number | null
  estimatedTotalDisplay: string
  sentAt: string | null
  conversationUuid: string | null
  messageUuid: string | null
  items: BuyerCartLine[]
  card: {
    cartId: number
    itemCount: number
    estimatedTotalDisplay: string | null
    businessName: string | null
    thumbnailUrl: string | null
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

function unwrapData(payload: unknown): RawRecord | null {
  const root = asRecord(payload)
  return asRecord(root?.data) ?? root
}

export function parseBuyerCart(raw: unknown): BuyerCart | null {
  const cart = asRecord(raw)
  if (!cart) return null
  const id = asNumber(cart.id)
  const businessInfoId = asNumber(cart.business_info_id)
  if (id === null || businessInfoId === null) return null

  const itemsRaw = Array.isArray(cart.items) ? cart.items : []
  const items: BuyerCartLine[] = itemsRaw
    .map((entry) => {
      const line = asRecord(entry)
      if (!line) return null
      const lineId = asNumber(line.id)
      const catalogItemId = asNumber(line.catalog_item_id)
      if (lineId === null || catalogItemId === null) return null
      return {
        id: lineId,
        catalogItemId,
        name: asString(line.name).trim() || 'Item',
        quantity: asNumber(line.quantity) ?? 1,
        unitPriceKobo: asNumber(line.unit_price_kobo),
        priceDisplay: asString(line.price_display, 'Price on request'),
        priceFrom: asBoolean(line.price_from),
        lineTotalKobo: asNumber(line.line_total_kobo),
        lineTotalDisplay: asString(line.line_total_display, asString(line.price_display, 'Price on request')),
        imageUrl: asString(line.image_url).trim() || null,
      }
    })
    .filter((line): line is BuyerCartLine => line !== null)

  const card = asRecord(cart.card)

  return {
    id,
    status: asString(cart.status, 'open'),
    businessInfoId,
    businessName: asString(cart.business_name, 'Business').trim() || 'Business',
    vendorUserUuid: asString(cart.vendor_user_uuid).trim() || null,
    itemCount: asNumber(cart.item_count) ?? items.reduce((sum, line) => sum + line.quantity, 0),
    estimatedTotalKobo: asNumber(cart.estimated_total_kobo),
    estimatedTotalDisplay: asString(cart.estimated_total_display, 'Price on request'),
    sentAt: asString(cart.sent_at).trim() || null,
    conversationUuid: asString(cart.conversation_uuid).trim() || null,
    messageUuid: asString(cart.message_uuid).trim() || null,
    items,
    card: {
      cartId: asNumber(card?.cart_id) ?? id,
      itemCount: asNumber(card?.item_count) ?? 0,
      estimatedTotalDisplay: asString(card?.estimated_total_display).trim() || null,
      businessName: asString(card?.business_name).trim() || null,
      thumbnailUrl: asString(card?.thumbnail_url).trim() || null,
    },
  }
}

export async function fetchBuyerCarts(): Promise<BuyerCart[]> {
  const res = await request.get('/cart')
  const data = unwrapData(res.data)
  const list = Array.isArray(data?.carts) ? data.carts : []
  return list.map(parseBuyerCart).filter((cart): cart is BuyerCart => cart !== null)
}

export async function fetchBuyerCartForBusiness(businessInfoId: number): Promise<BuyerCart | null> {
  const res = await request.get('/cart', { params: { business_info_id: businessInfoId } })
  const data = unwrapData(res.data)
  return parseBuyerCart(data?.cart)
}

export async function addBuyerCartItem(
  catalogItemId: number,
  quantity = 1,
): Promise<BuyerCart> {
  const res = await request.post('/cart/items', {
    catalog_item_id: catalogItemId,
    quantity,
  })
  const data = unwrapData(res.data)
  const cart = parseBuyerCart(data?.cart)
  if (!cart) throw new Error('Invalid cart response')
  return cart
}

export async function updateBuyerCartItemQuantity(
  cartItemId: number,
  quantity: number,
): Promise<BuyerCart> {
  const res = await request.patch(`/cart/items/${cartItemId}`, { quantity })
  const data = unwrapData(res.data)
  const cart = parseBuyerCart(data?.cart)
  if (!cart) throw new Error('Invalid cart response')
  return cart
}

export async function removeBuyerCartItem(cartItemId: number): Promise<BuyerCart> {
  const res = await request.delete(`/cart/items/${cartItemId}`)
  const data = unwrapData(res.data)
  const cart = parseBuyerCart(data?.cart)
  if (!cart) throw new Error('Invalid cart response')
  return cart
}

export type SendBuyerCartResult = {
  cart: BuyerCart
  conversationUuid: string
  message: Record<string, unknown> | null
}

export async function sendBuyerCart(input: {
  cartId?: number
  businessInfoId?: number
}): Promise<SendBuyerCartResult> {
  const res = await request.post('/cart/send', {
    cart_id: input.cartId,
    business_info_id: input.businessInfoId,
  })
  const data = unwrapData(res.data)
  const cart = parseBuyerCart(data?.cart)
  const conversationUuid = asString(data?.conversation_uuid).trim()
  if (!cart || !conversationUuid) throw new Error('Invalid send cart response')
  return {
    cart,
    conversationUuid,
    message: asRecord(data?.message),
  }
}

export async function fetchSentBuyerCart(cartMessageId: number): Promise<BuyerCart> {
  const res = await request.get(`/messages/carts/${cartMessageId}`)
  const data = unwrapData(res.data)
  const cart = parseBuyerCart(data?.cart)
  if (!cart) throw new Error('Sent cart not found')
  return cart
}

export const buyerCartQueryKey = ['buyer-cart'] as const
export const buyerCartBusinessQueryKey = (businessInfoId: number) =>
  ['buyer-cart', businessInfoId] as const
