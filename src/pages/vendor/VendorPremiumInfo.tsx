import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Crown, Loader2, Sparkles } from 'lucide-react'

import { useAuth } from '@/auth/useAuth'
import { getAccessToken } from '@/auth/token'
import { FREE_PHOTO_LIMIT, PREMIUM_PHOTO_LIMIT } from '@/constants/planLimits'
import {
  fetchPublicSubscriptionPackages,
  fetchSubscriptionStatus,
  startSubscriptionTrial,
  type SubscriptionPackage,
} from '@/features/subscription/vendorSubscriptionApi'
import { businessProfilePath } from '@/lib/businessProfile'
import { formatMoney } from '@/lib/currency'
import { getLaravelErrorMessage } from '@/lib/laravelApiError'
import { showError, showSuccess } from '@/lib/sweetAlert'
import { cn } from '@/lib/utils'
import { VENDOR_PREMIUM_PAYMENT_PATH } from '@/hooks/useVendorSubscriptionAccess'
import { Button } from '@/components/ui/button'

const BILLING_PERIOD_SUFFIX: Record<string, string> = {
  monthly: '/month',
  quarterly: '/quarter',
  yearly: '/year',
  lifetime: '',
}

const DEFAULT_PREMIUM_FEATURES = [
  `Up to ${PREMIUM_PHOTO_LIMIT} gallery photos (Free: ${FREE_PHOTO_LIMIT})`,
  'Insights — views, leads, followers and messages',
  'Contact leads breakdown on your dashboard',
  'Priority visibility in search results',
  'Premium badge on your public business page',
]

function PlanOptionCard({
  plan,
  currency,
  selected,
  onSelect,
}: {
  plan: SubscriptionPackage
  currency?: string
  selected: boolean
  onSelect: () => void
}) {
  const billingSuffix = plan.billing_period ? (BILLING_PERIOD_SUFFIX[plan.billing_period] ?? '') : ''
  const perks = plan.perks?.length ? plan.perks : DEFAULT_PREMIUM_FEATURES

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-2xl border-2 p-5 text-left transition-colors',
        selected ? 'border-[#C99A3F] bg-[#FBF1DC]/40' : 'border-border-light bg-white hover:border-[#C99A3F]/50',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-heading text-lg font-extrabold text-ink">{plan.title}</h2>
          {plan.is_recommended ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              <Sparkles className="size-3" /> Recommended
            </span>
          ) : null}
          {plan.trial_eligible ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              {plan.trial_duration_days ?? 0}-day trial
            </span>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          {plan.original_price ? (
            <p className="font-heading text-sm font-bold text-body-secondary line-through decoration-2">
              {formatMoney(plan.original_price, currency)}
            </p>
          ) : null}
          <p className="font-heading text-base font-extrabold text-[#9A6B1F]">
            {formatMoney(plan.amount, currency)}
            {billingSuffix ? <span className="block text-xs font-semibold text-body-secondary">{billingSuffix}</span> : null}
          </p>
        </div>
      </div>

      {plan.promotional_text ? (
        <p className="mt-1 text-xs font-semibold text-brand">{plan.promotional_text}</p>
      ) : null}

      {plan.description ? <p className="mt-2 text-sm text-body-secondary">{plan.description}</p> : null}

      <ul className="mt-4 space-y-2">
        {perks.map((perk) => (
          <li key={perk} className="flex items-start gap-2 text-sm text-ink">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#13a36b]" aria-hidden />
            <span>{perk}</span>
          </li>
        ))}
      </ul>
    </button>
  )
}

export default function VendorPremiumInfo() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const businessId = Number(searchParams.get('business_id') ?? '')
  const scopedBusinessId = Number.isFinite(businessId) && businessId > 0 ? businessId : undefined

  const { isAuthenticated } = useAuth()
  const canFetchAccountData = isAuthenticated || Boolean(getAccessToken())

  const packagesQuery = useQuery({
    queryKey: ['public', 'subscription-packages'],
    queryFn: fetchPublicSubscriptionPackages,
    staleTime: 60_000,
  })

  const statusQuery = useQuery({
    queryKey: ['vendor', 'subscription', 'status', 'premium-info', scopedBusinessId],
    queryFn: () => fetchSubscriptionStatus({ businessId: scopedBusinessId }),
    enabled: canFetchAccountData,
    retry: false,
  })

  const packages = packagesQuery.data?.packages ?? []
  const [selectedPackageKey, setSelectedPackageKey] = useState<string | null>(null)

  const selectedPlan =
    packages.find((p) => p.id === selectedPackageKey) ??
    packages.find((p) => p.is_recommended) ??
    packages[0]

  const subscription = statusQuery.data?.subscription
  const canStartTrial = Boolean(
    canFetchAccountData && subscription?.trial_eligible && selectedPlan?.trial_eligible,
  )

  const paymentParams = new URLSearchParams()
  if (scopedBusinessId) {
    paymentParams.set('business_id', String(scopedBusinessId))
  }
  if (selectedPlan) {
    paymentParams.set('package_key', selectedPlan.id)
  }
  const paymentPath = paymentParams.toString()
    ? `${VENDOR_PREMIUM_PAYMENT_PATH}?${paymentParams.toString()}`
    : VENDOR_PREMIUM_PAYMENT_PATH

  const trialMut = useMutation({
    mutationFn: () => {
      if (!selectedPlan) throw new Error('Select a plan first.')
      return startSubscriptionTrial({ packageKey: selectedPlan.id, businessId: scopedBusinessId })
    },
    onSuccess: (result) => {
      showSuccess(result.message)
      void queryClient.invalidateQueries({ queryKey: ['vendor', 'subscription'] })
      void queryClient.invalidateQueries({ queryKey: ['vendor', 'onboarding', 'status'] })
      navigate(scopedBusinessId ? businessProfilePath(scopedBusinessId) : '/user/profile')
    },
    onError: (error) => showError(getLaravelErrorMessage(error, 'Unable to start free trial.')),
  })

  return (
    <div className="min-h-dvh bg-bg-section px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FBF1DC] to-[#F6E4BC]">
            <Crown className="size-6 text-[#9A6B1F]" aria-hidden />
          </div>
          <h1 className="font-heading text-2xl font-extrabold text-ink">Gidira Premium</h1>
          <p className="mt-2 text-sm leading-relaxed text-body-secondary">
            Unlock insights, more photos, and premium visibility before you proceed to payment.
          </p>
        </div>

        <div className="space-y-3">
          {packages.length > 0 ? (
            packages.map((plan) => (
              <PlanOptionCard
                key={plan.id}
                plan={plan}
                currency={packagesQuery.data?.currency}
                selected={selectedPlan?.id === plan.id}
                onSelect={() => setSelectedPackageKey(plan.id)}
              />
            ))
          ) : (
            <PlanOptionCard
              plan={{ id: 'premium', title: 'Premium', amount: 0, description: '', perks: DEFAULT_PREMIUM_FEATURES }}
              selected
              onSelect={() => undefined}
            />
          )}
        </div>

        <div className="mt-8 space-y-3">
          {canStartTrial ? (
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full rounded-xl border-2 border-[#C99A3F] text-base font-bold text-[#9A6B1F] hover:bg-[#FBF1DC]/40"
              disabled={trialMut.isPending}
              onClick={() => void trialMut.mutate()}
            >
              {trialMut.isPending ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> : null}
              Start {selectedPlan?.trial_duration_days ?? 0}-day free trial
            </Button>
          ) : null}
          <Button
            type="button"
            className="h-12 w-full rounded-xl bg-gradient-to-br from-[#9A6B1F] to-[#C99A3F] text-base font-bold text-white hover:opacity-95"
            onClick={() => navigate(paymentPath)}
          >
            Continue to payment
          </Button>
          <Button type="button" variant="outline" className="h-11 w-full rounded-xl" asChild>
            <Link to="/user/profile">Not now</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
