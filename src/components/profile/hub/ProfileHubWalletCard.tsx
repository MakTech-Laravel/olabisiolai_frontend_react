import { Wallet } from 'lucide-react'

import { cn } from '@/lib/utils'

type ProfileHubWalletCardProps = {
  className?: string
}

export function ProfileHubWalletCard({ className }: ProfileHubWalletCardProps) {
  return (
    <div
      className={cn(
        'rounded-[18px] bg-gradient-to-br from-[#0B1F3F] via-[#102A52] to-[#163B6B] p-[18px] text-white shadow-[0_8px_24px_rgba(11,31,63,0.28)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white/75">
            <Wallet className="size-3.5" strokeWidth={2} aria-hidden />
            Gidira Wallet
          </span>
          <p className="mt-2 font-heading text-[28px] font-bold leading-none">₦0</p>
          <p className="mt-2 text-[12px] leading-relaxed text-white/70">Coming soon</p>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full bg-white/15 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wide text-white/80">
          Soon
        </span>
      </div>
    </div>
  )
}
