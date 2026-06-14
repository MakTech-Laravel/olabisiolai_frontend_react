import { Link } from 'react-router-dom'
import { BarChart3, Bell, Pencil, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type VendorOwnerToolbarProps = {
  businessId: number
  className?: string
}

const ownerLinks = [
  { label: 'Analytics', to: '/vendor/analytics', icon: BarChart3 },
  { label: 'Notifications', to: '/vendor/notifications', icon: Bell },
  { label: 'Verification', to: '/vendor/verification', icon: ShieldCheck },
] as const

export function VendorOwnerToolbar({ businessId, className }: VendorOwnerToolbarProps) {
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

      <div className="mt-4 flex flex-wrap gap-2">
        {ownerLinks.map(({ label, to, icon: Icon }) => (
          <Button key={to} asChild variant="outline" size="sm" className="rounded-lg bg-card">
            <Link to={to}>
              <Icon className="mr-1.5 size-4" aria-hidden />
              {label}
            </Link>
          </Button>
        ))}
        <Button asChild variant="default" size="sm" className="rounded-lg">
          <Link to="/vendor/profile">Full profile editor</Link>
        </Button>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Listing ID {businessId} — changes save directly to your public profile.
      </p>
    </div>
  )
}
