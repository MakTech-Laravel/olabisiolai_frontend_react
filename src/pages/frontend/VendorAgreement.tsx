import { Link } from 'react-router-dom'

import { FrontendHeader } from '@/components/partials/frontend/FrontendHeader'
import { FrontendFooter } from '@/components/partials/frontend/FrontendFooter'

export default function VendorAgreement() {
  return (
    <div className="min-h-dvh bg-background">
      <FrontendHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Link to="/user/settings" className="text-sm font-medium text-brand hover:underline">
          ← Settings & Activity
        </Link>
        <h1 className="mt-4 font-heading text-3xl font-bold text-ink-heading">Vendor Agreement</h1>
        <p className="mt-3 text-base leading-7 text-body-secondary">
          By listing on Gidira you agree to provide accurate business information, honour customer enquiries, comply
          with applicable laws, and maintain professional conduct on the platform.
        </p>
        <div className="mt-8 space-y-6 text-sm leading-7 text-body-secondary">
          <p>
            Premium, verification, and boost products are optional paid features. Fees are displayed before checkout.
            Gidira may remove listings that violate our policies or receive credible reports of fraud or abuse.
          </p>
          <p>
            For the full legal terms governing use of the platform, see our{' '}
            <Link to="/terms" className="font-semibold text-brand hover:underline">
              Terms & Conditions
            </Link>
            .
          </p>
        </div>
      </main>
      <FrontendFooter />
    </div>
  )
}
