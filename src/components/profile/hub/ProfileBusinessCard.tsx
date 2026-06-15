import { BadgeCheck, ChevronRight, Crown, Rocket } from 'lucide-react'

import { profileHubChipClass } from '@/components/profile/hub/ProfileIdentitySection'

import { isBusinessVerified, type ProfileHubBusiness } from './profileHubUtils'

type ProfileBusinessCardProps = {
  business: ProfileHubBusiness
  onManage: () => void
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
  'linear-gradient(135deg,#13a36b,#0d7a4f)',
]

export function ProfileBusinessCard({ business, onManage }: ProfileBusinessCardProps) {
  const verified = isBusinessVerified(business.verificationStatus)
  const isPremium = business.isPremiumActive === true
  const boostActive = business.boostStatus === 'active'
  const gradient = logoGradients[business.id % logoGradients.length]

  return (
    <button
      type="button"
      onClick={onManage}
      className="w-full overflow-hidden rounded-2xl border border-border-light bg-white text-left shadow-[0_1px_2px_rgba(16,22,32,0.05)] transition-transform active:scale-[0.99] lg:transition-shadow lg:hover:shadow-[0_6px_22px_rgba(16,22,32,0.08)]"
    >
      <div className="flex items-center gap-3.5 p-3.5">
        <div
          className="flex size-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] font-heading text-[19px] font-bold text-white"
          style={{ background: business.logoUrl ? undefined : gradient }}
        >
          {business.logoUrl ? (
            <img src={business.logoUrl} alt="" className="size-full object-cover" />
          ) : (
            businessInitials(business.businessName || 'Business')
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-heading text-[15.5px] font-bold text-ink">
              {business.businessName || 'Your business'}
            </span>
            {verified ? <BadgeCheck className="size-4 shrink-0 text-chat-accent" aria-hidden /> : null}
          </div>
          <p className="mt-0.5 truncate text-[12.5px] text-chat-meta">{business.categoryName}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {isPremium ? (
              <span className={profileHubChipClass('premium')}>
                <Crown className="size-2.5 fill-white text-white" aria-hidden />
                Premium
              </span>
            ) : (
              <span className={profileHubChipClass('free')}>Free</span>
            )}
            {boostActive ? (
              <span className={profileHubChipClass('boost')}>
                <Rocket className="size-2.5" strokeWidth={2} aria-hidden />
                Boosted
              </span>
            ) : null}
          </div>
        </div>

        <ChevronRight className="size-5 shrink-0 text-[#c3cad4]" strokeWidth={2} aria-hidden />
      </div>
    </button>
  )
}
