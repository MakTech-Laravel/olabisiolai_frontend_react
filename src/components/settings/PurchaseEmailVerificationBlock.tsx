import { AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { EmailVerificationProfile } from '@/api/userEmailVerification'
import { profileNeedsEmailVerification } from '@/api/userEmailVerification'
import { Button } from '@/components/ui/button'

type Props = {
  profile: EmailVerificationProfile | null | undefined
  settingsPath?: string
  title?: string
}

export function PurchaseEmailVerificationBlock({
  profile,
  settingsPath = '/vendor/settings',
  title = 'Verify your email to continue',
}: Props) {
  if (!profileNeedsEmailVerification(profile)) {
    return null
  }

  return (
    <div
      className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/30"
      role="alert"
    >
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
        <div className="min-w-0 space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-amber-950 dark:text-amber-50">{title}</h2>
            <p className="mt-1 text-sm text-amber-900/90 dark:text-amber-100/90">
              Your email <strong>{profile?.email}</strong> is not verified yet. Purchases are blocked until you
              confirm this address with the code we sent.
            </p>
          </div>
          <Button asChild size="sm" className="h-9">
            <Link to={settingsPath}>Go to settings & verify email</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
