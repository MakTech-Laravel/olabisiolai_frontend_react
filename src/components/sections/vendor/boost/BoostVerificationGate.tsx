import { Link } from 'react-router-dom'
import { BadgeCheck, Rocket } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function BoostVerificationGate() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 py-10 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
        <Rocket className="size-8" aria-hidden />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-red">Premium active</p>
        <h1 className="font-heading text-2xl font-bold text-ink">Verify your business to unlock Boost</h1>
        <p className="text-sm leading-6 text-body-secondary">
          Your Premium plan is active. Complete business verification to run boost campaigns and appear in the
          top search tier.
        </p>
      </div>

      <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left text-sm text-amber-950">
        <p className="font-semibold">Verification required</p>
        <p className="mt-1 text-amber-900">
          Only verified Premium businesses can purchase and run boost campaigns on Gidira.
        </p>
        <Button asChild type="button" className="mt-4 rounded-xl">
          <Link to="/vendor/verification">
            <BadgeCheck className="mr-1.5 size-4" aria-hidden />
            Verify my business
          </Link>
        </Button>
      </div>
    </div>
  )
}
