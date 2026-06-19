import { request } from '@/api/request'

export type FollowerOwnedBusiness = {
  id: number
  business_name: string
  logo_url: string | null
  category_name: string | null
  location: string | null
}

export type VendorFollower = {
  followerUserId: number
  followedAt: string
  user: {
    id: number
    uuid: string | null
    personalName: string
    name: string
    imageUrl: string | null
  } | null
  ownedBusinesses: FollowerOwnedBusiness[]
}

export type VendorFollowersPayload = {
  followers: VendorFollower[]
  count: number
  pagination: {
    current_page: number
    per_page: number
    last_page: number
    total: number
  }
}

type LaravelEnvelope<T> = {
  success?: boolean
  message?: string
  data?: T
}

function parseOwnedBusiness(raw: Record<string, unknown>): FollowerOwnedBusiness {
  return {
    id: Number(raw.id ?? 0),
    business_name: String(raw.business_name ?? ''),
    logo_url: (raw.logo_url as string | null | undefined) ?? null,
    category_name: (raw.category_name as string | null | undefined) ?? null,
    location: (raw.location as string | null | undefined) ?? null,
  }
}

function parseFollower(raw: Record<string, unknown>): VendorFollower {
  const userRaw = (raw.user ?? null) as Record<string, unknown> | null
  const businessesRaw = raw.owned_businesses

  return {
    followerUserId: Number(raw.follower_user_id ?? 0),
    followedAt: String(raw.followed_at ?? ''),
    user: userRaw
      ? {
          id: Number(userRaw.id ?? 0),
          uuid: userRaw.uuid != null ? String(userRaw.uuid) : null,
          personalName: String(userRaw.personal_name ?? userRaw.name ?? 'Member'),
          name: String(userRaw.name ?? userRaw.personal_name ?? 'Member'),
          imageUrl: (userRaw.image_url as string | null | undefined) ?? null,
        }
      : null,
    ownedBusinesses: Array.isArray(businessesRaw)
      ? businessesRaw.map((item) => parseOwnedBusiness(item as Record<string, unknown>))
      : [],
  }
}

export async function fetchVendorFollowers(page = 1, perPage = 20): Promise<VendorFollowersPayload> {
  const response = await request.get<LaravelEnvelope<Record<string, unknown>>>('/user/follows/followers', {
    params: { page, per_page: perPage },
  })

  const body = response.data
  if (!body?.success || !body.data) {
    throw new Error(body?.message || 'Could not load followers.')
  }

  const data = body.data
  const followersRaw = data.followers

  return {
    followers: Array.isArray(followersRaw)
      ? followersRaw.map((item) => parseFollower(item as Record<string, unknown>))
      : [],
    count: Number(data.count ?? 0),
    pagination: {
      current_page: Number((data.pagination as Record<string, unknown> | undefined)?.current_page ?? page),
      per_page: Number((data.pagination as Record<string, unknown> | undefined)?.per_page ?? perPage),
      last_page: Number((data.pagination as Record<string, unknown> | undefined)?.last_page ?? 1),
      total: Number((data.pagination as Record<string, unknown> | undefined)?.total ?? 0),
    },
  }
}
