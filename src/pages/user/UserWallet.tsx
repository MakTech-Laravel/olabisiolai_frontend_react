import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowLeft, Wallet } from 'lucide-react'

import { confirmWalletTopUp, fetchUserWallet, initWalletTopUp } from '@/api/wallet'
import { FrontendHeader } from '@/components/partials/frontend/FrontendHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { showError, showSuccess } from '@/lib/sweetAlert'

const PRESETS = [1000, 2500, 5000, 10000]

function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function UserWalletPage() {
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState('5000')

  const walletQuery = useQuery({
    queryKey: ['user', 'wallet'],
    queryFn: fetchUserWallet,
    staleTime: 15_000,
  })

  const topUpMutation = useMutation({
    mutationFn: async () => {
      const parsed = Number(amount)
      if (!Number.isFinite(parsed) || parsed < 500) {
        throw new Error('Enter at least ₦500 to top up.')
      }
      const checkout = await initWalletTopUp(parsed, 'paystack')
      await confirmWalletTopUp({
        payment_id: checkout.payment_id,
        gateway_transaction_id: checkout.tx_ref,
        gateway: checkout.gateway,
      })
    },
    onSuccess: async () => {
      showSuccess('Wallet topped up successfully.')
      await queryClient.invalidateQueries({ queryKey: ['user', 'wallet'] })
    },
    onError: (error) => {
      showError(error instanceof Error ? error.message : 'Top-up failed.')
    },
  })

  const wallet = walletQuery.data

  return (
    <div className="min-h-screen bg-auth-bg text-ink">
      <FrontendHeader />
      <main className="mx-auto w-full max-w-lg px-4 py-6 lg:max-w-2xl lg:py-10">
        <Link to="/user/profile" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-chat-accent">
          <ArrowLeft className="size-4" aria-hidden />
          Back to profile
        </Link>

        <div className="rounded-[20px] bg-gradient-to-br from-[#0B1F3F] via-[#102A52] to-[#163B6B] p-6 text-white shadow-lg">
          <div className="flex items-center gap-2 text-sm font-semibold text-white/75">
            <Wallet className="size-4" aria-hidden />
            Wallet balance
          </div>
          <p className="mt-3 font-heading text-4xl font-bold">
            {walletQuery.isLoading ? '—' : formatNaira(wallet?.balance ?? 0)}
          </p>
        </div>

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h1 className="font-heading text-xl font-bold">Top up</h1>
          <p className="mt-1 text-sm text-body-secondary">
            Add funds to pay for Premium, verification and boosts.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(String(preset))}
                className="rounded-full border border-border-light px-3 py-1.5 text-sm font-semibold text-ink"
              >
                {formatNaira(preset)}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Input
              type="number"
              min={500}
              step={100}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Amount in NGN"
            />
          </div>
          <Button
            type="button"
            className="mt-4 w-full rounded-full bg-chat-accent"
            disabled={topUpMutation.isPending}
            onClick={() => topUpMutation.mutate()}
          >
            {topUpMutation.isPending ? 'Processing…' : 'Top up wallet'}
          </Button>
        </section>

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
