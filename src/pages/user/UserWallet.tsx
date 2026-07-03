import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowLeft, Gift, Wallet } from 'lucide-react'

import { fetchUserWallet } from '@/api/wallet'
import { FrontendHeader } from '@/components/partials/frontend/FrontendHeader'

function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function UserWalletPage() {
  const walletQuery = useQuery({
    queryKey: ['user', 'wallet'],
    queryFn: fetchUserWallet,
    staleTime: 15_000,
  })

  const wallet = walletQuery.data

  return (
    <div className="min-h-screen bg-auth-bg text-ink">
      <FrontendHeader />
      <main className="container mx-auto px-2 lg:px-0 w-full py-6 lg:py-10">
        <Link to="/user/profile" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-chat-accent">
          <ArrowLeft className="size-4" aria-hidden />
          Back to profile
        </Link>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-[20px] bg-gradient-to-br from-[#0B1F3F] via-[#102A52] to-[#163B6B] p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/75">
              <Wallet className="size-4" aria-hidden />
              Wallet balance
            </div>
            <p className="mt-3 font-heading text-4xl font-bold">
              {walletQuery.isLoading ? '—' : formatNaira(wallet?.balance ?? 0)}
            </p>
            <p className="mt-2 text-xs text-white/60">
              Spend on Boost, Verification, or Premium at checkout. Not withdrawable as cash.
            </p>
          </div>

          <Link
            to="/user/referrals"
            className="flex items-center gap-3 rounded-2xl border border-border-light bg-white p-4 shadow-sm transition-colors hover:bg-auth-bg"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F6EF] text-[#13a36b]">
              <Gift className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-sm font-semibold text-ink">Invite vendors — earn ₦1,000</b>
              <small className="text-xs text-body-secondary">Grow your wallet balance with referrals</small>
            </span>
          </Link>
        </div>

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-heading text-lg font-bold">Recent transactions</h2>
          <div className="mt-4 space-y-3">
            {(wallet?.transactions ?? []).length === 0 ? (
              <p className="text-sm text-body-secondary">No transactions yet.</p>
            ) : (
              wallet?.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between gap-3 border-b border-border-light pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-ink">{tx.description}</p>
                    <p className="text-xs text-chat-meta">{new Date(tx.created_at).toLocaleString()}</p>
                  </div>
                  <p className={tx.type === 'credit' ? 'text-sm font-bold text-[#13a36b]' : 'text-sm font-bold text-brand'}>
                    {tx.type === 'credit' ? '+' : '-'}
                    {formatNaira(tx.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
