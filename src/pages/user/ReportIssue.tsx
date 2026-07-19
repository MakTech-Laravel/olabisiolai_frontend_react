import { type FormEvent, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import { getContactSubmitErrorMessage, submitContactMessage } from '@/api/contactMessages'
import { useAuth } from '@/auth/useAuth'
import { FrontendHeader } from '@/components/partials/frontend/FrontendHeader'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { alert, showError } from '@/lib/sweetAlert'

const REPORT_TYPES = {
  vendor: {
    title: 'Report a Vendor',
    subject: 'Report a vendor listing',
    description: 'Tell us which vendor and what happened. Include links.',
  },
  customer: {
    title: 'Report a Customer',
    subject: 'Report a customer',
    description: 'Report inappropriate customer behaviour. We review every submission.',
  },
  problem: {
    title: 'Report a Problem',
    subject: 'Report a technical problem',
    description: 'Describe the issue you experienced on Gidira so we can fix it.',
  },
} as const

type ReportType = keyof typeof REPORT_TYPES

export default function ReportIssue() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const typeParam = (searchParams.get('type') || 'problem') as ReportType
  const reportType = REPORT_TYPES[typeParam] ? typeParam : 'problem'
  const copy = REPORT_TYPES[reportType]

  const defaultName = useMemo(() => user?.name?.trim() || '', [user?.name])
  const defaultEmail = useMemo(() => user?.email?.trim() || '', [user?.email])

  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    setSubmitting(true)
    try {
      await submitContactMessage({
        full_name: String(data.get('name') ?? '').trim(),
        email: String(data.get('email') ?? '').trim(),
        subject: String(data.get('subject') ?? '').trim(),
        message: String(data.get('message') ?? '').trim(),
      })
      form.reset()
      await alert.success('Your report was sent. Our team will review it shortly.', 'Report submitted')
    } catch (error) {
      showError(getContactSubmitErrorMessage(error, 'Could not send your report. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-auth-bg text-ink">
      <FrontendHeader />

      <main className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
        <Link to="/user/settings" className="mb-4 inline-flex text-sm font-medium text-chat-accent hover:underline">
          ← Back to Settings & Activity
        </Link>

        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">{copy.title}</h1>
        <p className="mt-1 text-sm text-body-secondary">{copy.description}</p>

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-4 rounded-2xl bg-card p-6 shadow-sm">
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="report-name">
              Full name
            </label>
            <Input id="report-name" name="name" defaultValue={defaultName} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="report-email">
              Email
            </label>
            <Input id="report-email" name="email" type="email" defaultValue={defaultEmail} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="report-subject">
              Subject
            </label>
            <Input id="report-subject" name="subject" defaultValue={copy.subject} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="report-message">
              Details
            </label>
            <Textarea id="report-message" name="message" rows={6} required placeholder="Describe what happened…" />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Sending…
              </>
            ) : (
              'Submit report'
            )}
          </Button>
        </form>
      </main>
    </div>
  )
}
