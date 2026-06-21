import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, MapPin, UserMinus } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { toggleFollow } from '@/api/follows'
import { patchListingFollowStateInCache } from '@/features/follows/patchListingFollowCache'
import { DirectMessageButton } from '@/components/business/DirectMessageButton'
import { businessProfilePath } from '@/lib/businessProfile'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { showError } from '@/lib/sweetAlert'

export type FollowingBusinessCardProps = {
  followingUserId: number
  businessInfoId: number
  title: string
  category: string
  location: string
  image: string
  verified?: boolean
  vendorUserUuid?: string | null
}

export function FollowingBusinessCard({
  followingUserId,
  businessInfoId,
  title,
  category,
  location,
  image,
  verified = false,
  vendorUserUuid,
}: FollowingBusinessCardProps) {
  const queryClient = useQueryClient()
  const { pathname } = useLocation()
  const [unfollowing, setUnfollowing] = useState(false)
  const profileTo = businessProfilePath(businessInfoId)

  const handleUnfollow = async (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (unfollowing) return
    setUnfollowing(true)
    try {
      const result = await toggleFollow(followingUserId)
      patchListingFollowStateInCache(queryClient, {
        followingUserId,
        following: result.following,
        followersCount: result.followers_count,
      })
      void queryClient.invalidateQueries({ queryKey: ['user-following'] })
      void queryClient.invalidateQueries({ queryKey: ['follow-stats'] })
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Could not unfollow. Please try again.')
    } finally {
      setUnfollowing(false)
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-border-light bg-card shadow-sm">
      <div className="relative h-48 bg-muted">
        <Link to={profileTo} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
          <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
        </Link>
        <button
          type="button"
          onClick={handleUnfollow}
          disabled={unfollowing}
          className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-brand shadow-md transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Unfollow"
        >
          <UserMinus className="size-4" aria-hidden />
          {unfollowing ? 'Removing…' : 'Following'}
        </button>
        {verified ? (
          <div className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-footer-bar px-3 py-1 text-[11px] font-semibold text-ice">
            <CheckCircle2 className="size-3.5" aria-hidden />
            VERIFIED
          </div>
        ) : null}
      </div>

      <div className="space-y-3 p-5">
        <h3 className="line-clamp-1 text-lg font-semibold leading-7 text-ink-heading">
          <Link to={profileTo} className="hover:underline">
            {title}
          </Link>
        </h3>
        <div className="space-y-1">
          <p className="text-sm font-medium text-footer-bar">{category}</p>
          <p className="inline-flex items-center gap-1 text-sm text-body-secondary">
            <MapPin className="size-3.5" aria-hidden />
            {location}
          </p>
        </div>

        <div className="space-y-2 pt-1">
          <DirectMessageButton
            businessInfoId={businessInfoId}
            vendorUserUuid={vendorUserUuid}
            fromPath={pathname}
            messagesPath="/user/messages"
            className="h-11 w-full rounded-xl border-brand bg-surface-soft text-base font-medium text-brand hover:bg-surface-wash"
            iconClassName="size-4 shrink-0"
          />
        </div>
      </div>
    </article>
  )
}

export function followingBusinessImage(logoUrl: string | null | undefined): string {
  const resolved = resolveMediaUrl(logoUrl ?? '', '')
  return resolved || '/images/landing/placeholder-business.png'
}
