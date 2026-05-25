import { Link } from 'react-router-dom'
import { BadgeCheck, ExternalLink } from 'lucide-react'

import type { VendorSettingsVerification } from '@/api/vendorSettings'
import { Button } from '@/components/ui/button'

type Props = {
  verification: VendorSettingsVerification
}

export function VerifiedStatusCard({ verification }: Props) {
  const isApproved = verification.shows_verified_badge === true || verification.is_approved
  const isPending = verification.verification_status === 'pending' && !verification.is_flagged

  const title = isApproved ? 'Verified' : isPending ? 'Pending review' : 'Not verified'
  const subtitle = isApproved
    ? 'Your business is verified. Buyers see your trusted badge on listings and search.'
    : isPending
      ? 'Your documents are under review. We will notify you when verification is complete.'
      : 'Pay for verification, submit documents, and get approved to earn your trusted badge. Premium subscription is separate.'

  const ctaLabel = isApproved ? 'View verification' : isPending ? 'View status' : 'Try verify'

  return (
    <div className="relative overflow-hidden rounded-xl bg-brand-red p-6 text-white shadow-sm">
      <BadgeCheck className="mb-2 size-5 opacity-90" aria-hidden />
      <p className="text-[11px] font-semibold uppercase tracking-widest text-white/90">Authority status</p>
      <p className="mt-2 text-2xl font-bold font-manrope">{title}</p>
      <p className="mt-1 text-sm text-white/80 font-inter">{verification.verification_status_label}</p>
      <p className="mt-2 max-w-[260px] text-sm leading-relaxed text-white/90 font-inter">{subtitle}</p>
      <Button
        asChild
        variant="secondary"
        className="mt-5 rounded-full border-0 bg-white/20 px-5 text-white backdrop-blur-sm hover:bg-white/30"
      >
        <Link to="/vendor/verification">
          {ctaLabel}
          <ExternalLink className="size-4" aria-hidden />
        </Link>
      </Button>
      <BadgeCheck
        className="pointer-events-none absolute -bottom-2 -right-2 size-32 text-white/8"
        strokeWidth={1}
        aria-hidden
      />
    </div>
  )
}
