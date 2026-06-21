import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Loader2, Users } from 'lucide-react'

import { fetchVendorFollowers, type VendorFollower } from '@/api/vendorFollowers'
import { PersonProfilePanel } from '@/components/messaging/PersonProfilePanel'
import { ProfileHubSlidePanel } from '@/components/profile/hub/ProfileHubSlidePanel'
import { ProfileManageBackBar } from '@/components/profile/hub/ProfileIdentitySection'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/button'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { cn } from '@/lib/utils'

type VendorFollowersSectionProps = {
  followersCount?: number
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showTrigger?: boolean
}

function FollowerRow({
  follower,
  onOpen,
}: {
  follower: VendorFollower
  onOpen: () => void
}) {
  const name = follower.user?.personalName ?? follower.user?.name ?? 'Member'
  const avatar = resolveMediaUrl(follower.user?.imageUrl ?? '', '')
  const businessCount = follower.ownedBusinesses.length

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 border-b border-border-light px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-surface-soft"
    >
      <Avatar src={avatar || null} name={name} className="size-11 rounded-xl" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{name}</span>
        <span className="mt-0.5 block truncate text-xs text-chat-meta">
          Followed {follower.followedAt}
          {businessCount > 0
            ? ` · ${businessCount} business ${businessCount === 1 ? 'page' : 'pages'}`
            : ''}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-chat-meta" aria-hidden />
    </button>
  )
}

export function VendorFollowersSection({
  followersCount = 0,
  className,
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
}: VendorFollowersSectionProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<VendorFollower | null>(null)

  const followersQuery = useQuery({
    queryKey: ['vendor', 'followers', page],
    queryFn: () => fetchVendorFollowers(page, 20),
    enabled: open,
    staleTime: 30_000,
  })

  const followers = followersQuery.data?.followers ?? []
  const pagination = followersQuery.data?.pagination
  const total = pagination?.total ?? followersCount

  return (
    <>
      {showTrigger ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            'flex w-full items-center gap-3.5 rounded-2xl bg-white px-4 py-[15px] text-left shadow-[0_1px_2px_rgba(16,22,32,0.05)] transition-colors hover:bg-surface-soft',
            className,
          )}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FDEEEE] text-brand">
            <Users className="size-5" strokeWidth={2} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <b className="block text-[15px] font-semibold text-ink">Followers</b>
            <small className="block text-[12.5px] text-chat-meta">
              {total.toLocaleString()} {total === 1 ? 'person follows' : 'people follow'} your business
            </small>
          </span>
          <ChevronRight className="size-[18px] shrink-0 text-[#c3cad4]" strokeWidth={2} aria-hidden />
        </button>
      ) : null}

      <ProfileHubSlidePanel open={open} onClose={() => setOpen(false)}>
        <ProfileManageBackBar onBack={() => setOpen(false)} />
        <div className="border-b border-border-light px-4 pb-3">
          <h2 className="font-heading text-xl font-bold text-ink">Followers</h2>
        </div>
        <div className="flex-1 overflow-y-auto pb-8">
          {followersQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-8 animate-spin text-brand" aria-label="Loading followers" />
            </div>
          ) : followersQuery.isError ? (
            <p className="px-4 py-8 text-center text-sm text-red-700">
              Could not load followers. Please try again.
            </p>
          ) : followers.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <Users className="mx-auto size-10 text-chat-meta" aria-hidden />
              <p className="mt-3 text-sm font-semibold text-ink">No followers yet</p>
              <p className="mt-1 text-sm text-body-secondary">
                When people follow your business, they will appear here.
              </p>
            </div>
          ) : (
            <div className="mx-4 overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(16,22,32,0.05)]">
              {followers.map((follower) => (
                <FollowerRow
                  key={`${follower.followerUserId}-${follower.followedAt}`}
                  follower={follower}
                  onOpen={() => setSelected(follower)}
                />
              ))}
            </div>
          )}

          {pagination && pagination.last_page > 1 ? (
            <div className="mt-4 flex items-center justify-center gap-3 px-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || followersQuery.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <span className="text-xs text-chat-meta">
                Page {pagination.current_page} of {pagination.last_page}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= pagination.last_page || followersQuery.isFetching}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
      </ProfileHubSlidePanel>

      <PersonProfilePanel
        open={selected != null}
        onClose={() => setSelected(null)}
        personalName={selected?.user?.personalName ?? selected?.user?.name ?? 'Member'}
        imageUrl={selected?.user?.imageUrl ?? null}
        followedAt={selected?.followedAt ?? null}
        ownedBusinesses={selected?.ownedBusinesses ?? []}
      />
    </>
  )
}
