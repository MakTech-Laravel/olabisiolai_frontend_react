import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3'
import PaystackPop from '@paystack/inline-js'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Gift, Loader2, PlusCircle, Wallet } from 'lucide-react'

import { useAuth } from '@/auth/useAuth'
import {
  confirmWalletTopUp,
  fetchUserWallet,
  initWalletTopUp,
  type WalletTopUpInit,
} from '@/api/wallet'
import { env } from '@/config/env'
import {
  extractFlutterwaveTransactionId,
  isFlutterwavePaymentSuccessful,
  type FlutterwaveCallbackResponse,
} from '@/features/payments/flutterwaveResponse'
import { getLaravelErrorMessage } from '@/lib/laravelApiError'
import { showError, showSuccess } from '@/lib/sweetAlert'
import { FrontendHeader } from '@/components/partials/frontend/FrontendHeader'

type TopUpGateway = 'paystack' | 'flutterwave'

const TOP_UP_PRESETS = [1000, 2500, 5000, 10000, 25000] as const
const MIN_TOP_UP = 500
const TX_PER_PAGE = 20

function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount)
}

function parseTopUpAmount(raw: string): number | null {
  const parsed = Number(raw.replace(/[^\d.]/g, ''))
  if (!Number.isFinite(parsed) || parsed < MIN_TOP_UP) return null
  return Math.round(parsed)
}

export default function UserWalletPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [topUpAmount, setTopUpAmount] = useState('5000')
  const [selectedGateway, setSelectedGateway] = useState<TopUpGateway>('paystack')
  const [isPaying, setIsPaying] = useState(false)
  const [shouldOpenFlutterwave, setShouldOpenFlutterwave] = useState(false)
  const [pendingCheckout, setPendingCheckout] = useState<WalletTopUpInit | null>(null)
  const [page, setPage] = useState(1)

  const walletQuery = useQuery({
    queryKey: ['user', 'wallet', page, TX_PER_PAGE],
    queryFn: () => fetchUserWallet({ page, per_page: TX_PER_PAGE }),
    staleTime: 15_000,
    placeholderData: (previous) => previous,
  })

  const wallet = walletQuery.data
  const pagination = wallet?.pagination
  const lastPage = pagination?.last_page ?? 1
  const pageNumbers = useMemo(() => {
    const total = lastPage
    const current = pagination?.current_page ?? page
    const start = Math.max(1, current - 2)
    const end = Math.min(total, start + 4)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [lastPage, page, pagination?.current_page])
  const amountNgn = parseTopUpAmount(topUpAmount) ?? 0
  const customerEmail = user?.email?.trim() || 'guest@gidira.app'
  const customerName = user?.name?.trim() || 'Gidira User'
  const customerPhone = user?.phone?.trim() || '08000000000'
  const flutterTxRef = pendingCheckout?.tx_ref ?? `wallet_topup_${String(user?.id ?? 'guest')}`

  const refreshWallet = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['user', 'wallet'] })
  }, [queryClient])

  const handleTopUpSuccess = useCallback(async () => {
    setPage(1)
    await refreshWallet()
    showSuccess('Wallet topped up successfully.')
  }, [refreshWallet])

  const handleFlutterPayment = useFlutterwave({
    public_key: env.flutterwavePublicKey ?? '',
    tx_ref: flutterTxRef,
    amount: pendingCheckout?.amount ?? amountNgn,
    currency: pendingCheckout?.currency ?? 'NGN',
    payment_options: 'card',
    customer: {
      email: customerEmail,
      phone_number: customerPhone,
      name: customerName,
    },
    customizations: {
      title: 'Gidira Wallet Top-up',
      description: 'Add funds to your Gidira wallet',
      logo: '/favicon.svg',
    },
  })

  const openPaystack = useCallback(
    async (checkout: WalletTopUpInit) => {
      if (!env.paystackPublicKey) {
        showError('Paystack public key is missing. Set VITE_PAYSTACK_PUBLIC_KEY.')
        return
      }

      const paystack = new PaystackPop()
      paystack.newTransaction({
        key: env.paystackPublicKey,
        email: customerEmail,
        amount: Math.round(checkout.amount * 100),
        currency: checkout.currency || 'NGN',
        ref: checkout.tx_ref,
        metadata: {
          custom_fields: [
            { display_name: 'Customer name', variable_name: 'customer_name', value: customerName },
            { display_name: 'Phone', variable_name: 'phone', value: customerPhone },
          ],
        },
        onClose: () => {
          setIsPaying(false)
        },
        callback: async (response: { reference?: string }) => {
          try {
            const paystackRef = String(response?.reference ?? '').trim()
            if (!paystackRef) {
              showError('Payment completed but Paystack reference was missing.')
              return
            }

            await confirmWalletTopUp({
              payment_id: checkout.payment_id,
              gateway_transaction_id: paystackRef,
              gateway: 'paystack',
            })
            await handleTopUpSuccess()
          } catch (error) {
            showError(getLaravelErrorMessage(error, 'Could not confirm wallet top-up.'))
          } finally {
            setIsPaying(false)
          }
        },
      })
    },
    [customerEmail, customerName, customerPhone, handleTopUpSuccess],
  )

  const startTopUp = async () => {
    const amount = parseTopUpAmount(topUpAmount)
    if (amount === null) {
      showError(`Minimum top-up is ${formatNaira(MIN_TOP_UP)}.`)
      return
    }

    if (selectedGateway === 'paystack' && !env.paystackPublicKey) {
      showError('Paystack is not configured.')
      return
    }

    if (selectedGateway === 'flutterwave' && !env.flutterwavePublicKey) {
      showError('Flutterwave is not configured.')
      return
    }

    try {
      setIsPaying(true)
      const checkout = await initWalletTopUp(amount, selectedGateway)
      setPendingCheckout(checkout)

      if (selectedGateway === 'paystack') {
        await openPaystack(checkout)
        return
      }

      setShouldOpenFlutterwave(true)
    } catch (error) {
      setIsPaying(false)
      showError(getLaravelErrorMessage(error, 'Could not start wallet top-up.'))
    }
  }

  useEffect(() => {
    if (!shouldOpenFlutterwave || !pendingCheckout) {
      return
    }

    setShouldOpenFlutterwave(false)

    handleFlutterPayment({
      callback: async (response: FlutterwaveCallbackResponse) => {
        closePaymentModal()

        if (!isFlutterwavePaymentSuccessful(response)) {
          setIsPaying(false)
          showError('Payment was not completed.')
          return
        }

        const transactionId = extractFlutterwaveTransactionId(response)
        if (!transactionId) {
          setIsPaying(false)
          showError('Payment completed but transaction ID was missing.')
          return
        }

        try {
          await confirmWalletTopUp({
            payment_id: pendingCheckout.payment_id,
            gateway_transaction_id: transactionId,
            gateway: 'flutterwave',
          })
          await handleTopUpSuccess()
        } catch (error) {
          showError(getLaravelErrorMessage(error, 'Could not confirm wallet top-up.'))
        } finally {
          setIsPaying(false)
          setPendingCheckout(null)
        }
      },
      onClose: () => {
        setIsPaying(false)
        setPendingCheckout(null)
      },
    })
  }, [shouldOpenFlutterwave, pendingCheckout, handleFlutterPayment, handleTopUpSuccess])

  return (
    <div className="min-h-screen bg-auth-bg text-ink">
      <FrontendHeader />
      <main className="container mx-auto w-full px-2 py-6 lg:px-0 lg:py-10">
        <Link
          to="/user/profile"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-chat-accent"
        >
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
          <div className="flex items-center gap-2">
            <PlusCircle className="size-5 text-brand-red" aria-hidden />
            <h2 className="font-heading text-lg font-bold">Top up wallet</h2>
          </div>
          <p className="mt-1 text-sm text-body-secondary">
            Add funds with Paystack or Flutterwave. Minimum {formatNaira(MIN_TOP_UP)}.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {TOP_UP_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setTopUpAmount(String(preset))}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                  amountNgn === preset
                    ? 'border-brand-red bg-brand-red/10 text-brand-red'
                    : 'border-border-light bg-auth-bg text-ink hover:border-brand-red/40'
                }`}
              >
                {formatNaira(preset)}
              </button>
            ))}
          </div>

          <label className="mt-4 block space-y-1">
            <span className="text-xs font-medium text-body-secondary">Custom amount (₦)</span>
            <input
              type="number"
              min={MIN_TOP_UP}
              step={100}
              value={topUpAmount}
              onChange={(event) => setTopUpAmount(event.target.value)}
              className="w-full max-w-xs rounded-lg border border-border-light px-3 py-2 text-sm outline-none focus:border-brand-red"
            />
          </label>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(['paystack', 'flutterwave'] as const).map((gateway) => (
              <button
                key={gateway}
                type="button"
                onClick={() => setSelectedGateway(gateway)}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  selectedGateway === gateway
                    ? 'border-brand-red bg-brand-red/5'
                    : 'border-border-light bg-white hover:bg-auth-bg'
                }`}
              >
                <p className="text-sm font-semibold capitalize text-ink">{gateway}</p>
                <p className="text-xs text-body-secondary">Secure card payment</p>
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={isPaying || amountNgn < MIN_TOP_UP}
            onClick={() => void startTopUp()}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[180px]"
          >
            {isPaying ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Processing…
              </>
            ) : (
              <>Top up {formatNaira(amountNgn >= MIN_TOP_UP ? amountNgn : MIN_TOP_UP)}</>
            )}
          </button>
        </section>

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-bold">Recent transactions</h2>
            {walletQuery.isFetching && !walletQuery.isLoading ? (
              <Loader2 className="size-4 animate-spin text-body-secondary" aria-label="Refreshing" />
            ) : null}
          </div>
          <div className="mt-4 space-y-3">
            {walletQuery.isLoading ? (
              <p className="inline-flex items-center gap-2 text-sm text-body-secondary">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Loading transactions…
              </p>
            ) : (wallet?.transactions ?? []).length === 0 ? (
              <p className="text-sm text-body-secondary">No transactions yet.</p>
            ) : (
              wallet?.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-3 border-b border-border-light pb-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{tx.description}</p>
                    <p className="text-xs text-chat-meta">
                      {tx.created_at_human || (tx.created_at ? new Date(tx.created_at).toLocaleString() : '—')}
                    </p>
                  </div>
                  <p
                    className={
                      tx.type === 'credit' ? 'text-sm font-bold text-[#13a36b]' : 'text-sm font-bold text-brand'
                    }
                  >
                    {tx.type === 'credit' ? '+' : '-'}
                    {formatNaira(tx.amount)}
                  </p>
                </div>
              ))
            )}
          </div>

          {pagination && pagination.total > TX_PER_PAGE ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-body-secondary">
                Page {pagination.current_page} of {lastPage} · {pagination.total.toLocaleString()} total
              </p>
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || walletQuery.isFetching}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-light text-body-secondary hover:bg-auth-bg disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-4" />
                </button>
                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    disabled={walletQuery.isFetching}
                    className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium ${
                      page === p
                        ? 'bg-ink text-white'
                        : 'border border-border-light text-body-secondary hover:bg-auth-bg'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  disabled={page >= lastPage || walletQuery.isFetching}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-light text-body-secondary hover:bg-auth-bg disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  )
}
