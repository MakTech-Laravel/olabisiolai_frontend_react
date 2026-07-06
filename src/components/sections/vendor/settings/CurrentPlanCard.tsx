import { Award } from 'lucide-react'
import { useVendorSubscriptionAccess } from '@/hooks/useVendorSubscriptionAccess'

import type { VendorSettingsSubscription } from '@/api/vendorSettings'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TrialCountdown } from '@/components/sections/vendor/settings/TrialCountdown'

type Props = {
  subscription: VendorSettingsSubscription
}

export function CurrentPlanCard({ subscription }: Props) {
  const { goToPremiumPayment, goToBoost } = useVendorSubscriptionAccess()
  const isPremium = subscription.is_premium_active === true
  const canPayPremium = subscription.can_pay_premium === true

  return (
    <Card className="relative rounded-xl border-border-light shadow-sm">
      <Badge className="absolute -left-3 -top-3 z-50! bg-[#005E8D] px-8 py-1 text-base! font-semibold uppercase text-primary-foreground hover:bg-primary">
        {isPremium ? 'Premium' : 'Free'}
      </Badge>
      <CardContent className="px-6 pb-6 pt-14">
        <div className="flex gap-4">
          <div className="mb-3 flex size-14 items-center justify-center rounded-xl bg-tint-red bg-[#FF6B35]/10 text-brand-red">
            <Award className="size-7" aria-hidden />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-inter">Current Plan</p>
            <p className="text-xl font-bold text-foreground font-manrope">{subscription.plan_label}</p>
            {subscription.is_trial ? (
              <TrialCountdown
                trialEndsAt={subscription.trial_ends_at}
                daysRemaining={subscription.trial_days_remaining}
                className="mt-1.5"
              />
            ) : isPremium && subscription.expires_at ? (
              <p className="mt-1 text-xs text-muted-foreground font-inter">
                Valid until {subscription.expires_at}
                {typeof subscription.days_remaining === 'number' && subscription.days_remaining > 0
                  ? ` (${subscription.days_remaining} days left)`
                  : ''}
              </p>
            ) : null}
          </div>
        </div>
        {canPayPremium ? (
          <Button
            type="button"
            onClick={() => goToPremiumPayment()}
            className="mt-6 w-full cursor-pointer bg-brand-red font-inter font-semibold text-white shadow-none hover:bg-brand-red/90"
          >
            Upgrade to Premium
          </Button>
        ) : isPremium ? (
          <Button
            type="button"
            onClick={goToBoost}
            className="mt-6 w-full cursor-pointer bg-sky-100 font-inter font-semibold text-foreground shadow-none hover:bg-sky-100/80"
          >
            Manage subscription
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
