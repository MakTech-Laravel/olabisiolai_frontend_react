import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { BasicBoost } from '@/components/sections/vendor/boost/BasicBoost'
import { DynamicBoostConfigurator } from '@/components/sections/vendor/boost/DynamicBoostConfigurator'
import { VendorBoostCampaignsTable } from '@/components/sections/vendor/boost/VendorBoostCampaignsTable'
import { buildBoostCheckoutFromCampaign } from '@/features/boost/buildBoostCheckoutFromCampaign'
import type { BoostCampaignRow } from '@/features/boost/boostCampaignTypes'
import { saveBoostCheckoutSelection } from '@/features/boost/boostCheckoutSession'
import { buildBoostRenewalContext, type BoostRenewalContext } from '@/features/boost/boostRenewalContext'
import { fetchVendorBoostCatalog } from '@/features/boost/vendorBoostApi'
import { useVendorSubscriptionAccess } from '@/hooks/useVendorSubscriptionAccess'
import { showError } from '@/lib/sweetAlert'
import { Button } from '@/components/ui/button'

export default function VendorBoost() {
  const navigate = useNavigate()
  const { isPremiumActive: isPremium, goToPremiumPayment } = useVendorSubscriptionAccess()
  const [renewalContext, setRenewalContext] = useState<BoostRenewalContext | null>(null)
  const [prefilledLocationId, setPrefilledLocationId] = useState('')

  const { data: catalog, isPending: catalogLoading } = useQuery({
    queryKey: ['vendor', 'boost', 'catalog'],
    queryFn: fetchVendorBoostCatalog,
    enabled: isPremium,
    staleTime: 30_000,
  })

  function scrollToConfigurator() {
    window.setTimeout(() => {
      document.getElementById('boost-configurator')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  function handleContinuePayment(row: BoostCampaignRow) {
    if (!row.location?.id) {
      showError('This campaign is missing a target location. Contact support.')
      return
    }

    saveBoostCheckoutSelection(buildBoostCheckoutFromCampaign(row), { standalonePayment: true })
    navigate('/vendor/review-pay')
  }

  function handleExtendBoost(row: BoostCampaignRow) {
    const context = buildBoostRenewalContext(row, 'extend')
    if (!context) {
      showError('This campaign is missing a target location. Contact support.')
      return
    }

    setRenewalContext(context)
    setPrefilledLocationId(context.locationId)
    scrollToConfigurator()
  }

  function handleBoostAgain(row: BoostCampaignRow) {
    const context = buildBoostRenewalContext(row, 'boost_again')
    if (!context) {
      showError('This campaign is missing a target location. Contact support.')
      return
    }

    setRenewalContext(context)
    setPrefilledLocationId(context.locationId)
    scrollToConfigurator()
  }

  if (!isPremium) {
    return (
      <div className="w-full space-y-6 p-4 md:p-6">
        <BasicBoost />
        <Button type="button" className="w-full rounded-xl" onClick={() => goToPremiumPayment()}>
          Upgrade to Premium for Boost
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-8 p-4 md:p-6">
      <div id="boost-configurator">
        <DynamicBoostConfigurator
          catalog={catalog}
          catalogLoading={catalogLoading}
          renewalContext={renewalContext}
          onClearRenewalContext={() => {
            setRenewalContext(null)
            setPrefilledLocationId('')
          }}
          initialLocationId={prefilledLocationId}
        />
      </div>

      {(catalog?.campaigns?.length ?? 0) > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">Your campaigns</h2>
          <VendorBoostCampaignsTable
            rows={catalog?.campaigns ?? []}
            vendorActions
            onContinuePayment={handleContinuePayment}
            onExtendBoost={handleExtendBoost}
            onBoostAgain={handleBoostAgain}
          />
        </section>
      ) : null}
    </div>
  )
}
