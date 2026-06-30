import { Link } from 'react-router-dom'
import { BadgeCheck, Crown, Rocket } from 'lucide-react'

import { PremiumAccessButton } from '@/components/partials/vendor/PremiumAccessButton'
import { Button } from '@/components/ui/button'
import { useVendorSubscriptionAccess } from '@/hooks/useVendorSubscriptionAccess'
import { cn } from '@/lib/utils'

type VendorProfileBoostButtonProps = {
  className?: string
  compact?: boolean
}

export function VendorProfileBoostButton({ className, compact = false }: VendorProfileBoostButtonProps) {
  const { isPremiumActive, canBoost } = useVendorSubscriptionAccess()

  if (canBoost) {
    return (
      <Button
        asChild
        size={compact ? 'sm' : 'default'}
        className={cn('rounded-full font-semibold', className)}
      >
        <Link to="/vendor/boost">
          <Rocket className="mr-1.5 size-4" aria-hidden />
          Boost
        </Link>
      </Button>
    )
  }

  if (isPremiumActive) {
    return (
      <Button
        asChild
        size={compact ? 'sm' : 'default'}
        variant="outline"
        className={cn('rounded-full font-semibold', className)}
      >
        <Link to="/vendor/verification">
          <BadgeCheck className="mr-1.5 size-4" aria-hidden />
          Verify to Boost
        </Link>
      </Button>
    )
  }

  return (
    <PremiumAccessButton size={compact ? 'sm' : 'default'} className={cn('rounded-full', className)}>
      <Crown className="mr-1.5 size-4" aria-hidden />
      Upgrade
    </PremiumAccessButton>
  )
}
