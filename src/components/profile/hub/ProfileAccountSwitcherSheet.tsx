import { Check, Plus } from 'lucide-react'

import { HeaderAvatar } from '@/components/ui/HeaderAvatar'
import { ProfileHubSheet } from '@/components/profile/hub/ProfileHubSheet'
import type { ProfileHubBusiness } from '@/components/profile/hub/profileHubUtils'
import { cn } from '@/lib/utils'

type ProfileAccountSwitcherSheetProps = {
  open: boolean
  onClose: () => void
  displayName: string
  avatarUrl: string
  businesses: ProfileHubBusiness[]
  activeBusinessId: number | null
  onSelectPersonal: () => void
  onSelectBusiness: (business: ProfileHubBusiness) => void
  onAddBusiness?: () => void
  isAddingBusiness?: boolean
}

function businessInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'B'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase()
}

const logoGradients = [
  'linear-gradient(135deg,#E1242A,#B81C21)',
  'linear-gradient(135deg,#1C86E8,#1B4FD8)',
  'linear-gradient(135deg,#9A6B1F,#C99A3F)',
]

export function ProfileAccountSwitcherSheet({
  open,
  onClose,
  displayName,
  avatarUrl,
  businesses,
  activeBusinessId,
  onSelectPersonal,
  onSelectBusiness,
  onAddBusiness,
  isAddingBusiness = false,
}: ProfileAccountSwitcherSheetProps) {
  return (
    <ProfileHubSheet
      open={open}
      title="Switch account"
      subtitle="One profile, all your pages. Pick which one to manage."
      onClose={onClose}
    >
      <div className="pb-2">
        <button
          type="button"
          onClick={() => {
            onSelectPersonal()
            onClose()
          }}
          className={cn(
            'flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left',
            activeBusinessId === null ? 'bg-[#EAF2FD]' : 'bg-white active:bg-auth-bg',
          )}
        >
          <HeaderAvatar src={avatarUrl} alt={displayName} className="size-[46px] rounded-full" />
          <span className="min-w-0 flex-1">
            <b className="block text-[15px] font-semibold text-ink">{displayName}</b>
            <small className="block text-[12.5px] text-chat-meta">Personal profile</small>
          </span>
          {activeBusinessId === null ? <Check className="size-5 text-chat-accent" aria-hidden /> : null}
        </button>

        {businesses.map((business) => {
          const isActive = activeBusinessId === business.id
          const gradient = logoGradients[business.id % logoGradients.length]

          return (
            <button
              key={business.id}
              type="button"
              onClick={() => {
                onSelectBusiness(business)
                onClose()
              }}
              className={cn(
                'mt-1 flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left',
                isActive ? 'bg-[#EAF2FD]' : 'bg-white active:bg-auth-bg',
              )}
            >
              <div
                className="flex size-[46px] shrink-0 items-center justify-center overflow-hidden rounded-[13px] font-heading text-[17px] font-bold text-white"
                style={{ background: business.logoUrl ? undefined : gradient }}
              >
                {business.logoUrl ? (
                  <img src={business.logoUrl} alt="" className="size-full object-cover" />
                ) : (
                  businessInitials(business.businessName)
                )}
              </div>
              <span className="min-w-0 flex-1">
                <b className="block truncate text-[15px] font-semibold text-ink">{business.businessName}</b>
                <small className="block text-[12.5px] text-chat-meta">Business page</small>
              </span>
              {isActive ? <Check className="size-5 text-chat-accent" aria-hidden /> : null}
            </button>
          )
        })}

        <button
          type="button"
          disabled={!onAddBusiness || isAddingBusiness}
          onClick={() => {
            onAddBusiness?.()
            onClose()
          }}
          className="mt-2 flex w-full items-center gap-3 border-t border-border-light px-3 py-3.5 text-left disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex size-[46px] items-center justify-center rounded-[13px] bg-[#EAF2FD] text-chat-accent">
            <Plus className="size-[22px]" strokeWidth={2} aria-hidden />
          </span>
          <b className="text-[15px] font-semibold text-chat-accent">
            {isAddingBusiness ? 'Creating…' : 'Add another business'}
          </b>
        </button>
      </div>
    </ProfileHubSheet>
  )
}
