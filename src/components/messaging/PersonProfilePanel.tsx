import { Link } from 'react-router-dom'
import { Building2, X } from 'lucide-react'

import { Avatar } from '@/components/ui/Avatar'
import { businessProfilePath } from '@/lib/businessProfile'
import { peerOwnedBusinesses, peerPersonalName } from '@/lib/messagingPeer'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { cn } from '@/lib/utils'
import type { ConversationPeer } from '@/types/messagingPeer'
import type { FollowerOwnedBusiness } from '@/types/messagingPeer'

type PersonProfilePanelProps = {
  open: boolean
  onClose: () => void
  personalName: string
  imageUrl?: string | null
  subtitle?: string | null
  followedAt?: string | null
  ownedBusinesses?: FollowerOwnedBusiness[]
}

function BusinessChip({ business }: { business: FollowerOwnedBusiness }) {
  const logo = resolveMediaUrl(business.logo_url ?? '', '')
  const meta = [business.category_name, business.location].filter(Boolean).join(' · ')

  return (
    <Link
      to={businessProfilePath(business.id)}
      className="flex items-center gap-3 rounded-xl border border-border-light bg-white px-3 py-3 transition-colors hover:bg-surface-soft"
    >
      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-auth-bg">
        {logo ? (
          <img src={logo} alt="" className="size-full object-cover" />
        ) : (
          <Building2 className="size-4 text-chat-meta" aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{business.business_name}</span>
        {meta ? <span className="mt-0.5 block truncate text-xs text-chat-meta">{meta}</span> : null}
      </span>
    </Link>
  )
}

export function PersonProfilePanel({
  open,
  onClose,
  personalName,
  imageUrl,
  subtitle,
  followedAt,
  ownedBusinesses = [],
}: PersonProfilePanelProps) {
  return (
    <>
      <button
        type="button"
        aria-label="Close profile"
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-[70] bg-[rgba(8,12,18,0.42)] transition-opacity duration-200',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${personalName} profile`}
        className={cn(
          'fixed inset-x-0 bottom-0 z-[80] max-h-[min(85dvh,640px)] rounded-t-[24px] bg-auth-bg shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)]',
          'lg:inset-y-0 lg:left-auto lg:right-0 lg:flex lg:max-h-none lg:w-full lg:max-w-[420px] lg:flex-col lg:rounded-none lg:rounded-l-[24px]',
          open ? 'translate-y-0 lg:translate-x-0' : 'translate-y-full lg:translate-y-0 lg:translate-x-full',
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex w-full max-w-lg flex-col lg:max-w-none lg:h-full">
          <div className="flex items-center justify-between border-b border-border-light px-4 py-4">
            <h2 className="font-heading text-lg font-bold text-ink">Profile</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-chat-meta hover:bg-surface-soft"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5">
            <div className="flex flex-col items-center text-center">
              <Avatar src={imageUrl ?? null} name={personalName} className="size-20 rounded-2xl" />
              <h3 className="mt-4 font-heading text-xl font-bold text-ink">{personalName}</h3>
              {subtitle ? <p className="mt-1 text-sm text-body-secondary">{subtitle}</p> : null}
              {followedAt ? (
                <p className="mt-2 text-xs font-medium text-chat-meta">Followed {followedAt}</p>
              ) : null}
            </div>

            {ownedBusinesses.length > 0 ? (
              <div className="mt-6">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-chat-meta">
                  Business pages
                </h4>
                <div className="space-y-2">
                  {ownedBusinesses.map((business) => (
                    <BusinessChip key={business.id} business={business} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}

export function MessagingPeerProfilePanel({
  open,
  onClose,
  peer,
}: {
  open: boolean
  onClose: () => void
  peer: ConversationPeer | null | undefined
}) {
  if (!peer) return null

  const personalName = peerPersonalName(peer)
  const subtitle =
    peer.business_name?.trim() ||
    (peer.role === 'vendor' ? 'Business owner on Gidira' : 'Member on Gidira')

  return (
    <PersonProfilePanel
      open={open}
      onClose={onClose}
      personalName={personalName}
      imageUrl={peer.avatar_url}
      subtitle={subtitle}
      ownedBusinesses={peerOwnedBusinesses(peer)}
    />
  )
}
