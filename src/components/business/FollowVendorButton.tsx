import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { UserPlus, UserCheck } from 'lucide-react'

import { getFollowErrorMessage, toggleFollow } from '@/api/follows'
import { useAuth } from '@/auth/useAuth'
import { useRequireAuthNavigate } from '@/features/auth/useRequireAuthNavigate'
import { Button } from '@/components/ui/button'
import { showError, showSuccess } from '@/lib/sweetAlert'
import { cn } from '@/lib/utils'

type FollowVendorButtonProps = {
  followingUserId: number | null
  initialFollowing?: boolean
  disabled?: boolean
  listingPath: string
  className?: string
  variant?: 'default' | 'outline'
  size?: 'default' | 'compact'
  showLabel?: boolean
  fullWidth?: boolean
  onFollowChange?: (following: boolean, followersCount?: number) => void
  onClick?: (event: React.MouseEvent) => void
}

export function FollowVendorButton({
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
  }, [initialFollowing, followingUserId])

  if (!followingUserId) {
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
      const result = await toggleFollow(followingUserId!)
      setIsFollowing(result.following)
      onFollowChange?.(result.following, result.followers_count)
      showSuccess(result.following ? 'You are now following this vendor.' : 'Unfollowed successfully.')
      await queryClient.invalidateQueries({ queryKey: ['follow-stats'] })
      await queryClient.invalidateQueries({ queryKey: ['business'] })
      await queryClient.invalidateQueries({ queryKey: ['businesses'] })
      await queryClient.invalidateQueries({ queryKey: ['filters'] })
      await queryClient.invalidateQueries({ queryKey: ['user-following'] })
    } catch (error) {
      showError(getFollowErrorMessage(error, 'Could not update follow status. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const label = isFollowing ? 'Following' : 'Follow'
  const resolvedVariant = isFollowing && fullWidth ? 'default' : variant

  const isCompact = size === 'compact'

  return (
    <Button
      type="button"
      variant={resolvedVariant}
      disabled={disabled || loading || !isAuthReady || isSessionLoading || isUserLoading}
      onClick={(event) => void handleToggle(event)}
      aria-pressed={isFollowing}
      className={cn(
        'gap-2',
        isCompact && 'h-8 rounded-full px-3 text-xs font-semibold',
        fullWidth && 'h-14 w-full rounded-xl text-base font-medium',
        !fullWidth && isFollowing && variant === 'outline' && 'border-brand bg-brand/5 text-brand',
        fullWidth &&
          isFollowing &&
          'border border-brand bg-brand text-ice hover:bg-brand/90 hover:text-ice',
        fullWidth &&
          !isFollowing &&
          'border border-brand bg-surface-soft text-brand hover:bg-surface-soft/80',
        className,
      )}
    >
      {!isCompact ? (
        isFollowing ? (
          <UserCheck className="size-5 shrink-0" aria-hidden />
        ) : (
          <UserPlus className="size-5 shrink-0" aria-hidden />
        )
      ) : null}
      {showLabel ? (loading ? 'Please wait…' : label) : null}
    </Button>
  )
}
