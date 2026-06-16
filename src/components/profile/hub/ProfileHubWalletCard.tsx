import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Wallet } from 'lucide-react'

import { fetchUserWallet } from '@/api/wallet'
import { cn } from '@/lib/utils'

function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount)
}

type ProfileHubWalletCardProps = {
  className?: string
}

export function ProfileHubWalletCard({ className }: ProfileHubWalletCardProps) {
  const walletQuery = useQuery({
    queryKey: ['user', 'wallet'],
    queryFn: fetchUserWallet,
    staleTime: 30_000,
  })

  const balance = walletQuery.data?.balance ?? 0

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
          <p className="mt-2 font-heading text-[28px] font-bold leading-none">
            {walletQuery.isLoading ? '—' : formatNaira(balance)}
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-white/70">
            Pay for Premium, verification and boosts. Top up anytime — no withdrawals.
          </p>
        </div>
        <Link
          to="/user/wallet"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2 text-[12.5px] font-bold text-white backdrop-blur-sm transition hover:bg-white/25"
        >
          <Plus className="size-3.5" strokeWidth={2.5} aria-hidden />
          Top up
        </Link>
      </div>
    </div>
  )
}
