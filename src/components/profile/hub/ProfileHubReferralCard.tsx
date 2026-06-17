import { Gift } from 'lucide-react'

import { cn } from '@/lib/utils'

type ProfileHubReferralCardProps = {
  className?: string
}

export function ProfileHubReferralCard({ className }: ProfileHubReferralCardProps) {
  return (
    <div
      className={cn(
        'rounded-[16px] border border-border-light bg-white p-4 shadow-[0_1px_2px_rgba(16,22,32,0.05)]',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F6EF] text-[#13a36b]">
          <Gift className="size-5" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <b className="block text-[15px] font-semibold text-ink">Invite vendors — Earn ₦1,000</b>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-chat-meta">Coming soon</p>
          <p className="mt-2 rounded-lg bg-auth-bg px-3 py-2 text-[12px] text-chat-meta">
            Share your referral link from here once referrals launch on the customer dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}
