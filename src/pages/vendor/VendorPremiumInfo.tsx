import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Crown } from 'lucide-react'

import { FREE_PHOTO_LIMIT, PREMIUM_ANNUAL_PRICE, PREMIUM_PHOTO_LIMIT } from '@/constants/planLimits'
import { formatNaira } from '@/lib/currency'
import { VENDOR_PREMIUM_PAYMENT_PATH } from '@/hooks/useVendorSubscriptionAccess'
import { Button } from '@/components/ui/button'

const premiumFeatures = [
  `Up to ${PREMIUM_PHOTO_LIMIT} gallery photos (Free: ${FREE_PHOTO_LIMIT})`,
  'Insights — views, leads, followers and messages',
  'Contact leads breakdown on your dashboard',
  'Priority visibility in search results',
  'Premium badge on your public business page',
]

export default function VendorPremiumInfo() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const businessId = Number(searchParams.get('business_id') ?? '')
  const paymentPath =
    Number.isFinite(businessId) && businessId > 0
      ? `${VENDOR_PREMIUM_PAYMENT_PATH}?business_id=${businessId}`
      : VENDOR_PREMIUM_PAYMENT_PATH

  return (
    <div className="min-h-dvh bg-bg-section px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="relative rounded-[24px] bg-white p-6 shadow-sm">
          <p className="absolute right-6 top-6 text-right font-heading text-base font-extrabold text-[#9A6B1F]">
            {formatNaira(PREMIUM_ANNUAL_PRICE, { freeLabel: false })}
            <span className="block text-sm font-semibold text-body-secondary">/year</span>
          </p>

          <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FBF1DC] to-[#F6E4BC]">
            <Crown className="size-6 text-[#9A6B1F]" aria-hidden />
          </div>
          <h1 className="pr-28 font-heading text-2xl font-extrabold text-ink">Gidira Premium</h1>
          <p className="mt-2 text-sm leading-relaxed text-body-secondary">
            Unlock insights, more photos, and premium visibility before you proceed to payment.
          </p>

          <ul className="mt-6 space-y-3">
            {premiumFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-ink">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#13a36b]" aria-hidden />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 space-y-3">
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
    </div>
  )
}
