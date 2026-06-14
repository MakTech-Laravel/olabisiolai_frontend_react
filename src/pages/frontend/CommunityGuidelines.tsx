import { Link } from 'react-router-dom'

import { FrontendHeader } from '@/components/partials/frontend/FrontendHeader'
import { FrontendFooter } from '@/components/partials/frontend/FrontendFooter'

type PolicyPageProps = {
  title: string
  intro: string
  sections: Array<{ heading: string; body: string }>
}

function PolicyPage({ title, intro, sections }: PolicyPageProps) {
  return (
    <div className="min-h-dvh bg-background">
      <FrontendHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Link to="/user/settings" className="text-sm font-medium text-brand hover:underline">
          ← Settings & Activity
        </Link>
        <h1 className="mt-4 font-heading text-3xl font-bold text-ink-heading">{title}</h1>
        <p className="mt-3 text-base leading-7 text-body-secondary">{intro}</p>
        <div className="mt-8 space-y-6">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-semibold text-ink">{section.heading}</h2>
              <p className="mt-2 text-sm leading-7 text-body-secondary">{section.body}</p>
            </section>
          ))}
        </div>
      </main>
      <FrontendFooter />
    </div>
  )
}

export default function CommunityGuidelines() {
  return (
    <PolicyPage
      title="Community Guidelines"
      intro="Gidira is built on trust. These guidelines keep the marketplace respectful and useful for customers and vendors."
      sections={[
        {
          heading: 'Be honest',
          body: 'Business listings, reviews, and messages must be truthful. Do not misrepresent services, prices, or credentials.',
        },
        {
          heading: 'Be respectful',
          body: 'Harassment, hate speech, spam, and abusive behaviour are not allowed on profiles, messages, or reviews.',
        },
        {
          heading: 'Report concerns',
          body: 'Use Settings & Activity → Support & Info to report vendors, customers, or platform issues so we can investigate.',
        },
      ]}
    />
  )
}
