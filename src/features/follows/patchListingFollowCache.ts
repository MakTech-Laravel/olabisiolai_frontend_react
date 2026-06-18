import type { InfiniteData, QueryClient } from '@tanstack/react-query'

import type { PublicBusiness, PublicBusinessesPage } from '@/features/business/publicBusinessApi'

export type ListingFollowCachePatch = {
  followingUserId: number
  following: boolean
  followersCount?: number
}

function resolveFollowersCount(
  current: number,
  patch: ListingFollowCachePatch,
): number {
  if (typeof patch.followersCount === 'number' && Number.isFinite(patch.followersCount)) {
    return Math.max(0, patch.followersCount)
  }

  return Math.max(0, current + (patch.following ? 1 : -1))
}

function patchBusiness(
  business: PublicBusiness,
  patch: ListingFollowCachePatch,
): PublicBusiness {
  if (business.vendorUserId !== patch.followingUserId) {
    return business
  }

  return {
    ...business,
    isFollowing: patch.following,
    followersCount: resolveFollowersCount(business.followersCount, patch),
  }
}

function patchBusinessList(
  businesses: PublicBusiness[],
  patch: ListingFollowCachePatch,
): PublicBusiness[] {
  return businesses.map((business) => patchBusiness(business, patch))
}

/**
 * Updates follow state in cached listing/detail queries without refetching.
 * Keeps home and filters card order stable after follow/unfollow.
 */
export function patchListingFollowStateInCache(
  queryClient: QueryClient,
  patch: ListingFollowCachePatch,
): void {
  queryClient.setQueriesData<PublicBusiness[]>(
    { queryKey: ['businesses'] },
    (cached) => (cached ? patchBusinessList(cached, patch) : cached),
  )

  queryClient.setQueriesData<InfiniteData<PublicBusinessesPage>>(
    { queryKey: ['filters'] },
    (cached) => {
      if (!cached) return cached

      return {
        ...cached,
        pages: cached.pages.map((page) => ({
          ...page,
          items: patchBusinessList(page.items, patch),
        })),
      }
    },
  )

  queryClient.setQueriesData<PublicBusiness>(
    { queryKey: ['business'] },
    (cached) => (cached ? patchBusiness(cached, patch) : cached),
  )
}
