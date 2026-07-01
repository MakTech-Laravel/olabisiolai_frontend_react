import { useEffect, useMemo, useState } from 'react'
import { Loader2, Rocket } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { DynamicBoostBudgetFields } from '@/components/sections/vendor/boost/DynamicBoostBudgetFields'
import { TargetLocationCard } from '@/components/sections/vendor/boost/boostConfigure/TargetLocationCard'
import { Button } from '@/components/ui/button'
import { saveBoostCheckoutSelection } from '@/features/boost/boostCheckoutSession'
import {
  clampBoostBudget,
  computeBoostTotal,
  DYNAMIC_BOOST_BUDGET_MAX,
  DYNAMIC_BOOST_BUDGET_MIN,
  DYNAMIC_BOOST_DURATIONS,
  DYNAMIC_BOOST_TIER_KEY,
  formatBoostBudget,
  normalizeBoostDurations,
  type DynamicBoostDuration,
} from '@/features/boost/dynamicBoostConfig'
import type { BoostRenewalContext } from '@/features/boost/boostRenewalContext'
import { initVendorBoostPayment, type VendorBoostCatalog } from '@/features/boost/vendorBoostApi'
import { useVendorBusinessFormOptions } from '@/features/categories/useVendorBusinessFormOptions'
import { parseVendorBoostLocationList } from '@/features/locations/vendorLocationOptions'
import { showError } from '@/lib/sweetAlert'
import { getLaravelErrorMessage } from '@/lib/laravelApiError'

type DynamicBoostConfiguratorProps = {
  catalog: VendorBoostCatalog | undefined
  catalogLoading: boolean
  renewalContext?: BoostRenewalContext | null
  onClearRenewalContext?: () => void
  initialLocationId?: string
}

export function DynamicBoostConfigurator({
  catalog,
  catalogLoading,
  renewalContext = null,
  onClearRenewalContext,
  initialLocationId = '',
}: DynamicBoostConfiguratorProps) {
  const navigate = useNavigate()
  const { data: formOptions } = useVendorBusinessFormOptions()
  const parsedLocations = useMemo(() => {
    const fromCatalog = parseVendorBoostLocationList(catalog?.boostLocations, true)
    if (fromCatalog.length > 0) return fromCatalog
    return parseVendorBoostLocationList(formOptions?.locations)
  }, [catalog?.boostLocations, formOptions?.locations])

  const defaultLocationId = catalog?.location?.id ?? parsedLocations[0]?.id ?? ''
  const [selectedLocationId, setSelectedLocationId] = useState(initialLocationId || defaultLocationId)
  const [durationDays, setDurationDays] = useState<DynamicBoostDuration>(3)
  const [dailyBudget, setDailyBudget] = useState(1500)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  useEffect(() => {
    if (initialLocationId) {
      setSelectedLocationId(initialLocationId)
      return
    }
    if (!selectedLocationId && parsedLocations[0]?.id) {
      setSelectedLocationId(parsedLocations[0].id)
    }
  }, [initialLocationId, parsedLocations, selectedLocationId])

  const dynamicConfig = catalog?.dynamic
  const durations = useMemo(
    () => normalizeBoostDurations(dynamicConfig?.durations),
    [dynamicConfig?.durations],
  )
  const budgetMin = dynamicConfig?.budgetMin ?? DYNAMIC_BOOST_BUDGET_MIN
  const budgetMax = dynamicConfig?.budgetMax ?? DYNAMIC_BOOST_BUDGET_MAX

  const activeLocation = useMemo(() => {
    const id = renewalContext?.locationId || selectedLocationId || defaultLocationId
    if (id) {
      const fromList = parsedLocations.find((entry) => entry.id === id)
      if (fromList) {
        return fromList
      }
      if (renewalContext && catalog?.location?.id === id) {
        return catalog.location
      }
      if (renewalContext) {
        return {
          id: renewalContext.locationId,
          location: 'Nigeria',
          state: '',
          city: '',
          lga: renewalContext.locationLabel,
          label: renewalContext.locationLabel,
          boost: null,
        }
      }
    }
    return catalog?.location ?? parsedLocations[0] ?? null
  }, [
    renewalContext,
    selectedLocationId,
    defaultLocationId,
    parsedLocations,
    catalog?.location,
  ])

  const clampedDaily = clampBoostBudget(dailyBudget)
  const totalCost = computeBoostTotal(clampedDaily, durationDays)
  const isExtending = renewalContext?.renewType === 'extend'
  const isBoostAgain = renewalContext?.renewType === 'boost_again'

  async function handleCheckout() {
    const checkoutLocationId = renewalContext?.locationId || activeLocation?.id

    if (!checkoutLocationId || !activeLocation) {
      showError('Select a target LGA first.')
      return
    }

    if (!renewalContext && catalog?.pendingRequest?.status === 'pending_admin') {
      showError('You already have a boost waiting for admin approval.')
      return
    }

    setIsCheckingOut(true)

    try {
      const { payment, requestId } = await initVendorBoostPayment({
        durationDays,
        budgetAmount: clampedDaily,
        locationId: checkoutLocationId,
        renewType: renewalContext?.renewType,
        sourceCampaignId: renewalContext?.sourceCampaignId,
      })

      saveBoostCheckoutSelection(
        {
          locationId: checkoutLocationId,
          locationLabel: renewalContext?.locationLabel ?? activeLocation.label,
          tierKey: renewalContext?.tierKey ?? DYNAMIC_BOOST_TIER_KEY,
          tierLabel: renewalContext?.tierLabel ?? dynamicConfig?.tierLabel ?? 'Dynamic Boost',
          durationDays,
          amount: totalCost,
          budgetAmount: clampedDaily,
          paymentId: payment.id,
          requestId,
          renewType: renewalContext?.renewType,
          sourceCampaignId: renewalContext?.sourceCampaignId,
        },
        { standalonePayment: true },
      )

      onClearRenewalContext?.()
      navigate('/vendor/review-pay')
    } catch (error) {
      showError(getLaravelErrorMessage(error, 'Could not start boost checkout.'))
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
              Increase visibility in your target LGA. Choose daily budget and duration for admin-enabled locations.
            </p>
          </div>
        </div>
      </section>

      <TargetLocationCard
        locations={parsedLocations}
        location={activeLocation}
        selectedLocationId={selectedLocationId || defaultLocationId}
        onLocationChange={renewalContext ? undefined : setSelectedLocationId}
        readOnly={Boolean(renewalContext)}
      />

      {renewalContext ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <p className="font-semibold">
            {isExtending ? 'Extend boost' : isBoostAgain ? 'Boost again' : 'Renew boost'} for{' '}
            {renewalContext.locationLabel}
          </p>
          <p className="mt-1 text-emerald-900">
            Choose how many extra days and your daily budget, then continue to payment.
          </p>
          {onClearRenewalContext ? (
            <button
              type="button"
              className="mt-2 text-xs font-semibold underline"
              onClick={onClearRenewalContext}
            >
              Cancel {isExtending ? 'extension' : 'renewal'}
            </button>
          ) : null}
        </div>
      ) : null}

      <DynamicBoostBudgetFields
        dailyBudget={dailyBudget}
        durationDays={durationDays}
        onDailyBudgetChange={setDailyBudget}
        onDurationChange={setDurationDays}
        durations={durations.length > 0 ? durations : DYNAMIC_BOOST_DURATIONS}
        budgetMin={budgetMin}
        budgetMax={budgetMax}
      />

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
            {isExtending ? (
              <>Extend boost for {formatBoostBudget(totalCost)}</>
            ) : isBoostAgain ? (
              <>Boost again for {formatBoostBudget(totalCost)}</>
            ) : (
              <>Boost for {formatBoostBudget(totalCost)}</>
            )}
          </>
        )}
      </Button>
    </div>
  )
}
