import { Link } from 'react-router-dom'

import { FrontendHeader } from '@/components/partials/frontend/FrontendHeader'
import { FrontendFooter } from '@/components/partials/frontend/FrontendFooter'

export default function RefundPolicy() {
  return (
    <div className="min-h-dvh bg-background">
      <FrontendHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Link to="/user/settings" className="text-sm font-medium text-brand hover:underline">
          ← Settings & Activity
        </Link>
        <h1 className="mt-4 font-heading text-3xl font-bold text-ink-heading">Refund Policy</h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-body-secondary">
          <section>
            <h2 className="text-lg font-semibold text-ink">Premium subscriptions</h2>
            <p className="mt-2">
              Premium plan charges are generally non-refundable once activated. Contact support if you believe a
              billing error occurred.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink">Verification fee</h2>
            <p className="mt-2">
              The one-time verification fee covers document review. Refunds apply only if payment was duplicated or
              Gidira cannot process your submission.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-ink">Boost campaigns</h2>
            <p className="mt-2">
              Boost purchases are for visibility services over the selected duration. Unused or rejected campaigns may
              be eligible for review — contact us with your payment reference.
            </p>
          </section>
          <p>
            Questions?{' '}
            <Link to="/contact" className="font-semibold text-brand hover:underline">
              Contact support
            </Link>
            .
          </p>
        </div>
      </main>
      <FrontendFooter />
    </div>
  )
}
