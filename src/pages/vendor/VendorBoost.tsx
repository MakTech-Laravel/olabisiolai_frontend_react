import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { BasicBoost } from '@/components/sections/vendor/boost/BasicBoost'
import { DynamicBoostConfigurator } from '@/components/sections/vendor/boost/DynamicBoostConfigurator'
import { VendorBoostCampaignsTable } from '@/components/sections/vendor/boost/VendorBoostCampaignsTable'
import { fetchVendorBoostCatalog } from '@/features/boost/vendorBoostApi'
import { useVendorSubscriptionAccess, VENDOR_PREMIUM_PAYMENT_PATH } from '@/hooks/useVendorSubscriptionAccess'
import { Button } from '@/components/ui/button'

export default function VendorBoost() {
  const { isPremiumActive: isPremium, isVerified, canBoost } = useVendorSubscriptionAccess()

  const { data: catalog, isPending: catalogLoading } = useQuery({
    queryKey: ['vendor', 'boost', 'catalog'],
    queryFn: fetchVendorBoostCatalog,
    enabled: isPremium,
    staleTime: 30_000,
  })

  if (!isPremium) {
    return (
      <div className="w-full space-y-6 p-4 md:p-6">
        <BasicBoost />
        <Button asChild className="w-full rounded-xl">
          <Link to={VENDOR_PREMIUM_PAYMENT_PATH}>Upgrade to Premium for Boost</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-8 p-4 md:p-6">
      {!isVerified || !canBoost ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {isVerified
            ? 'Complete your business verification to unlock boost campaigns.'
            : 'Verify your business before activating boost. Boost is separate from Premium.'}{' '}
          <Link to="/vendor/verification" className="font-semibold underline">
            Go to verification
          </Link>
        </div>
      ) : null}

      <DynamicBoostConfigurator catalog={catalog} catalogLoading={catalogLoading} />

      {(catalog?.campaigns?.length ?? 0) > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">Your campaigns</h2>
          <VendorBoostCampaignsTable rows={catalog?.campaigns ?? []} vendorActions />
        </section>
      ) : null}
    </div>
  )
}
