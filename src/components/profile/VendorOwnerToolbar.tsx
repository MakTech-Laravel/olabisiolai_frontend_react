import { Link } from 'react-router-dom'
import { BadgeCheck, Bell, Crown, Pencil, Settings, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useVendorSubscriptionAccess } from '@/hooks/useVendorSubscriptionAccess'
import { cn } from '@/lib/utils'

type VendorOwnerToolbarProps = {
  businessId: number
  className?: string
}

const ownerLinks = [
  { label: 'Activity', to: '/user/activity', icon: Bell },
  { label: 'Verification', to: '/vendor/verification', icon: ShieldCheck },
] as const

export function VendorOwnerToolbar({ businessId, className }: VendorOwnerToolbarProps) {
  const {
    isPremiumActive,
    isVerified,
    photoLimit,
    analyticsLocked,
    goToPremiumPayment,
  } = useVendorSubscriptionAccess()

  return (
    <div
      className={cn(
        'rounded-2xl border border-brand/20 bg-brand/5 p-4 sm:p-5',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">Owner mode</p>
          <p className="mt-1 text-sm text-body-secondary">
            Tap the pencil icons to edit fields inline, or use vendor tools below.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
          <Pencil className="size-3.5" aria-hidden />
          Editable
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-border-light bg-card px-4 py-3 text-sm">
          <p className="font-semibold text-ink">
            {isPremiumActive ? 'Premium plan' : 'Free plan'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Up to {photoLimit} gallery photos
            {analyticsLocked ? ' · Analytics locked' : ' · Analytics unlocked'}
          </p>
          {!isPremiumActive ? (
            <Button type="button" size="sm" className="mt-2" onClick={() => goToPremiumPayment(businessId)}>
              <Crown className="mr-1.5 size-4" aria-hidden />
              Upgrade to Premium
            </Button>
          ) : null}
        </div>

        <div className="rounded-xl border border-border-light bg-card px-4 py-3 text-sm">
          <p className="inline-flex items-center gap-1.5 font-semibold text-ink">
            {isVerified ? (
              <>
                <BadgeCheck className="size-4 text-brand" aria-hidden />
                Verified business
              </>
            ) : (
              <>
                <ShieldCheck className="size-4 text-muted-foreground" aria-hidden />
                Not verified yet
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Verification is separate from Premium and unlocks boost.
          </p>
          {!isVerified ? (
            <Button asChild size="sm" variant="outline" className="mt-2">
              <Link to="/vendor/verification">Verify my business</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {ownerLinks.map(({ label, to, icon: Icon }) => (
          <Button key={to} asChild variant="outline" size="sm" className="rounded-lg bg-card">
            <Link to={to}>
              <Icon className="mr-1.5 size-4" aria-hidden />
              {label}
            </Link>
          </Button>
        ))}
        <Button asChild variant="outline" size="sm" className="rounded-lg bg-card">
          <Link to="/user/settings">
            <Settings className="mr-1.5 size-4" aria-hidden />
            Settings & Activity
          </Link>
        </Button>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Listing ID {businessId} — changes save directly to your public profile.
      </p>
    </div>
  )
}
