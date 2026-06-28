import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { UserPlus, UserCheck } from 'lucide-react'

import { getFollowErrorMessage, toggleFollow } from '@/api/follows'
import { useAuth } from '@/auth/useAuth'
import { patchListingFollowStateInCache } from '@/features/follows/patchListingFollowCache'
import { useRequireAuthNavigate } from '@/features/auth/useRequireAuthNavigate'
import { Button } from '@/components/ui/button'
import { showError } from '@/lib/sweetAlert'
import { cn } from '@/lib/utils'

type FollowVendorButtonProps = {
  businessId: number
  followingUserId: number | null
  initialFollowing?: boolean
  disabled?: boolean
  listingPath: string
  className?: string
  variant?: 'default' | 'outline' | 'pill'
  size?: 'default' | 'compact'
  showLabel?: boolean
  fullWidth?: boolean
  onFollowChange?: (following: boolean, followersCount?: number) => void
  onClick?: (event: React.MouseEvent) => void
}

export function FollowVendorButton({
  businessId,
  followingUserId,
  initialFollowing = false,
  disabled = false,
  listingPath,
  className,
  variant = 'outline',
  size = 'default',
  showLabel = true,
  fullWidth = false,
  onFollowChange,
  onClick,
}: FollowVendorButtonProps) {
  const queryClient = useQueryClient()
  const { isSessionLoading, isUserLoading, isAuthenticated } = useAuth()
  const { requireAuthNavigate, isAuthReady } = useRequireAuthNavigate()
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setIsFollowing(initialFollowing)
  }, [initialFollowing, followingUserId, businessId])

  if (!followingUserId || businessId <= 0) {
    return null
  }

  async function handleToggle(event: React.MouseEvent) {
    event.stopPropagation()
    onClick?.(event)
    if (!isAuthReady || loading || disabled) return

    if (!isAuthenticated) {
      requireAuthNavigate(listingPath, { state: { from: listingPath } })
      return
    }

    setLoading(true)
    try {
      const result = await toggleFollow(followingUserId!, businessId)
      setIsFollowing(result.following)
      onFollowChange?.(result.following, result.followers_count)
      patchListingFollowStateInCache(queryClient, {
        businessId,
        followingUserId: followingUserId!,
        following: result.following,
        followersCount: result.followers_count,
      })
      void queryClient.invalidateQueries({ queryKey: ['follow-stats'] })
      void queryClient.invalidateQueries({ queryKey: ['user-following'] })
    } catch (error) {
      showError(getFollowErrorMessage(error, 'Could not update follow status. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const label = isFollowing ? 'Following' : 'Follow'
  const unfollowLabel = 'Unfollow'
  const isPill = variant === 'pill'
  const resolvedVariant = isPill ? 'outline' : isFollowing && fullWidth ? 'default' : variant

  const isCompact = size === 'compact'
  const ariaLabel = isFollowing
    ? `Unfollow this business. Currently following.`
    : 'Follow this business'

  return (
    <Button
      type="button"
      variant={resolvedVariant}
      disabled={disabled || loading || !isAuthReady || isSessionLoading || isUserLoading}
      onClick={(event) => void handleToggle(event)}
      onPointerDown={(event) => event.stopPropagation()}
      aria-pressed={isFollowing}
      aria-label={showLabel ? undefined : ariaLabel}
      title={isFollowing ? 'Click to unfollow' : 'Click to follow'}
      className={cn(
        'gap-2',
        isPill &&
          'h-auto rounded-full border-[1.5px] border-chat-accent bg-chat-accent px-[18px] py-2 text-sm font-semibold text-white shadow-none hover:bg-[#1568C0] hover:text-white',
        isPill &&
          isFollowing &&
          'border-[#cfe2fb] bg-white text-chat-accent hover:bg-[#EAF2FD] hover:text-[#1568C0]',
        isCompact && !isPill && 'h-8 rounded-full px-3 text-xs font-semibold',
        fullWidth && !isPill && 'h-14 w-full rounded-xl text-base font-medium',
        !fullWidth && !isPill && isFollowing && variant === 'outline' && 'border-brand bg-brand/5 text-brand',
        fullWidth &&
          !isPill &&
          isFollowing &&
          'border border-brand bg-brand text-ice hover:bg-brand/90 hover:text-ice',
        fullWidth &&
          !isPill &&
          !isFollowing &&
          'border border-brand bg-surface-soft text-brand hover:bg-surface-soft/80',
        className,
      )}
    >
      {!isCompact && !isPill ? (
        isFollowing ? (
          <UserCheck className="w-4 h-4 shrink-0" aria-hidden />
        ) : (
          <UserPlus className="w-4 h-4 shrink-0" aria-hidden />
        )
      ) : null}
      {isPill && !isFollowing ? (
        <UserPlus className="w-4 h-4 shrink-0" aria-hidden />
      ) : null}
      {isPill && isFollowing ? (
        <UserCheck className="w-4 h-4 shrink-0" aria-hidden />
      ) : null}
      {showLabel ? (
        loading ? (
          'Please wait…'
        ) : isPill && isFollowing ? (
          <span className="group/follow-toggle inline-flex min-w-[4.75rem] justify-center">
            <span className="group-hover/follow-toggle:hidden">{label}</span>
            <span className="hidden group-hover/follow-toggle:inline">{unfollowLabel}</span>
          </span>
        ) : (
          label
        )
      ) : null}
    </Button>
  )
}
