import { Link } from 'react-router-dom'
import { ChevronRight, Wallet } from 'lucide-react'

import { formatNaira } from '@/lib/currency'
import { cn } from '@/lib/utils'

type ProfileHubWalletCardProps = {
  balance: number
  isLoading?: boolean
  className?: string
}

export function ProfileHubWalletCard({ balance, isLoading, className }: ProfileHubWalletCardProps) {
  return (
    <Link
      to="/user/wallet"
      className={cn(
        'block rounded-[18px] bg-gradient-to-br from-[#0B1F3F] via-[#102A52] to-[#163B6B] p-[18px] text-white shadow-[0_8px_24px_rgba(11,31,63,0.28)] transition-opacity active:opacity-90',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white/75">
            <Wallet className="size-3.5" strokeWidth={2} aria-hidden />
            Gidira Wallet
          </span>
          <p className="mt-2 font-heading text-[28px] font-bold leading-none">
            {isLoading ? '—' : formatNaira(balance, { freeLabel: false })}
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-white/70">Spend on Boost, Verification or Premium</p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-white/60" strokeWidth={2} aria-hidden />
      </div>
    </Link>
  )
}
