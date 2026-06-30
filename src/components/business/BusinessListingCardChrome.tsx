import { BadgeCheck, Crown, Zap } from 'lucide-react'

import { BusinessProfileLink } from '@/components/business/BusinessProfileLink'
import { cn } from '@/lib/utils'

type BusinessListingStatusBadgesProps = {
  isPremium?: boolean
  isBoosted?: boolean
  className?: string
}

export function BusinessListingStatusBadges({
  isPremium = false,
  isBoosted = false,
  className,
}: BusinessListingStatusBadgesProps) {
  if (!isPremium && !isBoosted) {
    return null
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {isPremium ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-br from-[#9A6B1F] to-[#C99A3F] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-[0_4px_12px_rgba(154,107,31,0.4)]">
          <Crown className="size-3 fill-white" aria-hidden />
          Premium
        </span>
      ) : null}
      {isBoosted ? (
        <span className="inline-flex items-center rounded-full bg-amber-500 px-2 py-1 text-xs font-semibold text-white">
          <Zap className="mr-1 size-3" aria-hidden />
          BOOSTED
        </span>
      ) : null}
    </div>
  )
}

type BusinessListingCardTitleProps = {
  businessId: number
  businessName: string
  verified?: boolean
}

export function BusinessListingCardTitle({
  businessId,
  businessName,
  verified = false,
}: BusinessListingCardTitleProps) {
  return (
    <div className="min-w-0 flex-1 ">
      <h3 className="min-w-0 break-words text-lg font-inter font-semibold leading-snug text-text-primary">
        <BusinessProfileLink businessId={businessId} businessName={businessName} />
        <span className="inline-flex items-center gap-1 ml-2">{verified ? <BadgeCheck className="size-4 shrink-0 text-chat-accent" aria-label="Verified business" /> : null}</span>
      </h3>
    </div>
  )
}
