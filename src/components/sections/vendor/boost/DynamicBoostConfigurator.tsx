import { useMemo, useState } from 'react'
import { Loader2, Rocket } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { TargetLocationCard } from '@/components/sections/vendor/boost/boostConfigure/TargetLocationCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { saveBoostCheckoutSelection } from '@/features/boost/boostCheckoutSession'
import {
  clampBoostBudget,
  DYNAMIC_BOOST_BUDGET_MAX,
  DYNAMIC_BOOST_BUDGET_MIN,
  DYNAMIC_BOOST_BUDGET_STEP,
  DYNAMIC_BOOST_DURATIONS,
  DYNAMIC_BOOST_TIER_KEY,
  formatBoostBudget,
  type DynamicBoostDuration,
} from '@/features/boost/dynamicBoostConfig'
import { initVendorBoostPayment, type VendorBoostCatalog } from '@/features/boost/vendorBoostApi'
import { useVendorBusinessFormOptions } from '@/features/categories/useVendorBusinessFormOptions'
import { parseVendorLocationOptions } from '@/features/locations/vendorLocationOptions'
import { showError } from '@/lib/sweetAlert'
import { cn } from '@/lib/utils'

type DynamicBoostConfiguratorProps = {
  catalog: VendorBoostCatalog | undefined
  catalogLoading: boolean
}

export function DynamicBoostConfigurator({ catalog, catalogLoading }: DynamicBoostConfiguratorProps) {
  const navigate = useNavigate()
  const { data: formOptions } = useVendorBusinessFormOptions()
  const parsedLocations = useMemo(
    () => parseVendorLocationOptions(formOptions?.locations),
    [formOptions?.locations],
  )

  const defaultLocationId = catalog?.location?.id ?? parsedLocations[0]?.id ?? ''
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [durationDays, setDurationDays] = useState<DynamicBoostDuration>(3)
  const [budgetAmount, setBudgetAmount] = useState(1500)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const dynamicConfig = catalog?.dynamic
  const durations = dynamicConfig?.durations ?? [...DYNAMIC_BOOST_DURATIONS]
  const budgetMin = dynamicConfig?.budgetMin ?? DYNAMIC_BOOST_BUDGET_MIN
  const budgetMax = dynamicConfig?.budgetMax ?? DYNAMIC_BOOST_BUDGET_MAX

  const activeLocation = useMemo(() => {
    const id = selectedLocationId || defaultLocationId
    if (id) {
      return parsedLocations.find((entry) => entry.id === id) ?? catalog?.location ?? null
    }
    return catalog?.location ?? parsedLocations[0] ?? null
  }, [selectedLocationId, defaultLocationId, parsedLocations, catalog?.location])

  async function handleCheckout() {
    if (!activeLocation) {
      showError('Select a target LGA first.')
      return
    }

    if (catalog?.pendingRequest?.status === 'pending_admin') {
      showError('You already have a boost waiting for admin approval.')
      return
    }

    const amount = clampBoostBudget(budgetAmount)
    setIsCheckingOut(true)

    try {
      const { payment } = await initVendorBoostPayment({
        durationDays,
        budgetAmount: amount,
        locationId: activeLocation.id,
      })

      saveBoostCheckoutSelection(
        {
          locationId: activeLocation.id,
          locationLabel: activeLocation.label,
          tierKey: DYNAMIC_BOOST_TIER_KEY,
          tierLabel: dynamicConfig?.tierLabel ?? 'Dynamic Boost',
          durationDays,
          amount,
          paymentId: payment.id,
        },
        { standalonePayment: true },
      )

      navigate('/vendor/review-pay')
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Could not start boost checkout.')
    } finally {
      setIsCheckingOut(false)
    }
  }

  if (catalogLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-brand" aria-label="Loading boost options" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border-light bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Rocket className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-ink">Dynamic Boost</h2>
            <p className="mt-1 text-sm text-body-secondary">
              Increase visibility in your target LGA. Choose duration and budget — no slot limits. Multiple vendors can
              boost the same area and rotate fairly in search results.
            </p>
          </div>
        </div>
      </section>

      <TargetLocationCard
        locations={parsedLocations}
        location={activeLocation}
        selectedLocationId={selectedLocationId || defaultLocationId}
        onLocationChange={setSelectedLocationId}
      />

      <section className="rounded-2xl border border-border-light bg-card p-5 shadow-sm sm:p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-chat-meta">Duration</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {durations.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setDurationDays(days as DynamicBoostDuration)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                durationDays === days
                  ? 'border-brand bg-brand text-white'
                  : 'border-border-light bg-surface-soft text-ink hover:border-brand/40',
              )}
            >
              {days} {days === 1 ? 'day' : 'days'}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border-light bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-chat-meta">Budget</h3>
            <p className="mt-1 text-sm text-body-secondary">
              {formatBoostBudget(budgetMin)} – {formatBoostBudget(budgetMax)}
            </p>
          </div>
          <p className="text-lg font-semibold text-brand">{formatBoostBudget(clampBoostBudget(budgetAmount))}</p>
        </div>

        <Input
          type="range"
          min={budgetMin}
          max={budgetMax}
          step={DYNAMIC_BOOST_BUDGET_STEP}
          value={budgetAmount}
          onChange={(event) => setBudgetAmount(Number(event.target.value))}
          className="mt-4"
          aria-label="Boost budget"
        />

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[500, 1500, 5000].map((preset) => (
            <Button
              key={preset}
              type="button"
              variant="outline"
              size="sm"
              className={cn(clampBoostBudget(budgetAmount) === preset && 'border-brand text-brand')}
              onClick={() => setBudgetAmount(preset)}
            >
              {formatBoostBudget(preset)}
            </Button>
          ))}
        </div>
      </section>

      <Button
        type="button"
        className="h-12 w-full rounded-xl text-base font-semibold"
        disabled={isCheckingOut || !activeLocation}
        onClick={() => void handleCheckout()}
      >
        {isCheckingOut ? (
          <>
            <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
            Starting checkout…
          </>
        ) : (
          <>
            <Rocket className="mr-2 size-5" aria-hidden />
            Boost for {formatBoostBudget(clampBoostBudget(budgetAmount))}
          </>
        )}
      </Button>
    </div>
  )
}
