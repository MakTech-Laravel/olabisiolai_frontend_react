import { Link } from 'react-router-dom'
import { ChevronRight, Gift } from 'lucide-react'

import { formatNaira } from '@/lib/currency'
import { cn } from '@/lib/utils'

type ProfileHubReferralCardProps = {
  inviteCount: number
  earned: number
  className?: string
}

export function ProfileHubReferralCard({ inviteCount, earned, className }: ProfileHubReferralCardProps) {
  return (
    <Link
      to="/user/referrals"
      className={cn(
        'flex items-start gap-3 rounded-[16px] border border-border-light bg-white p-4 shadow-[0_1px_2px_rgba(16,22,32,0.05)] transition-colors active:bg-auth-bg lg:hover:bg-auth-bg',
        className,
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F6EF] text-[#13a36b]">
        <Gift className="size-5" strokeWidth={2} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <b className="block text-[15px] font-semibold text-ink">Invite vendors — Earn ₦1,000</b>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-chat-meta">
          {inviteCount} vendor{inviteCount === 1 ? '' : 's'} invited · {formatNaira(earned, { freeLabel: false })} earned
        </p>
      </div>
      <ChevronRight className="size-[18px] shrink-0 self-center text-[#c3cad4]" strokeWidth={2} aria-hidden />
    </Link>
  )
}
