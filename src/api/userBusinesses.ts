import { request } from '@/api/request'
import type { AuthUser } from '@/auth/types'
import {
  parseVendorBusinessProfile,
  type VendorBusinessProfile,
} from '@/features/business/vendorBusinessProfileApi'
import { extractUserFromAuthPayload } from '@/api/laravelResponse'

type RawRecord = Record<string, unknown>

function asRecord(value: unknown): RawRecord | null {
  if (!value || typeof value !== 'object') return null
  return value as RawRecord
}

function pickString(source: RawRecord, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return fallback
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

export type UserBusinessListItem = VendorBusinessProfile & {
  followersCount: number
  reviewsCount: number
}

function parseBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === '1'
}

function parseListItem(raw: unknown): UserBusinessListItem | null {
  const business = parseVendorBusinessProfile(raw)
  if (!business) return null

  const item = asRecord(raw)
  return {
    ...business,
    isPremiumActive: business.isPremiumActive || parseBoolean(item?.is_premium_active),
    followersCount: asNumber(item?.followers_count),
    reviewsCount: asNumber(item?.reviews_count),
  }
}

export type CreateUserBusinessResult = {
  business: UserBusinessListItem
  user: AuthUser | null
}

export async function createUserBusiness(businessName?: string): Promise<CreateUserBusinessResult> {
  const res = await request.post('/user/businesses', {
    ...(businessName?.trim() ? { business_name: businessName.trim() } : {}),
  })
  const root = asRecord(res.data)

  if (!root || root.success !== true) {
    const message = pickString(root ?? {}, ['message'], 'Failed to create business page.')
    throw new Error(message)
  }

  const data = asRecord(root.data)
  const business = parseListItem(data?.business)
  if (!business) {
    throw new Error('Business page was created but the response was invalid.')
  }

  const userPayload = data?.user
  const user =
    userPayload && typeof userPayload === 'object'
      ? (extractUserFromAuthPayload(userPayload) as AuthUser | null)
      : null

  return { business, user }
}

export async function deleteUserBusiness(businessId: number): Promise<void> {
  const res = await request.delete(`/user/businesses/${businessId}`)
  const root = asRecord(res.data)

  if (!root || root.success !== true) {
    const message = pickString(root ?? {}, ['message'], 'Failed to delete business page.')
    throw new Error(message)
  }
}

export async function setActiveBusinessId(businessId: number | null): Promise<void> {
  await request.patch('/user/settings', {
    settings: {
      active_business_id: businessId,
    },
  })
}

export async function fetchUserBusinesses(): Promise<UserBusinessListItem[]> {
  const res = await request.get('/user/businesses')
  const root = asRecord(res.data)

  if (!root || root.success !== true) {
    const message = pickString(root ?? {}, ['message'], 'Failed to load businesses.')
    throw new Error(message)
  }

  const data = asRecord(root.data)
  const list = Array.isArray(data?.businesses) ? data.businesses : []

  return list
    .map((entry) => parseListItem(entry))
    .filter((entry): entry is UserBusinessListItem => entry !== null)
}
