import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, MapPin, Wallet } from 'lucide-react'

import {
  careerJobPath,
  getCareerJobBySlug,
  handleCareerApply,
} from '@/features/careers/careerJobs'
import { container } from '@/lib/container'
import { cn } from '@/lib/utils'

function CheckIcon() {
  return (
    <span
      className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border border-brand-red"
      aria-hidden
    >
      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
        <path
          d="M1 4l3 3 5-6"
          stroke="#C0392B"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

export default function CareerJobDetail() {
  const { slug } = useParams<{ slug: string }>()
  const job = getCareerJobBySlug(slug)
  const [applied, setApplied] = useState(false)

  if (!job) {
    return <Navigate to="/careers" replace />
  }

  const onApply = async () => {
    const opened = await handleCareerApply(job.title)
    if (opened) setApplied(true)
  }

  return (
    <div className="w-full bg-muted py-8 sm:py-12">
      <div className={cn(container, 'mx-auto max-w-3xl space-y-4')}>
        <Link
          to="/careers#open-positions"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-red hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to open positions
        </Link>

        <div className="rounded-xl border border-border-light bg-card px-6 py-6 shadow-sm sm:px-7">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            <Link
              to={careerJobPath(job.slug)}
              className="hover:text-brand-red hover:underline"
            >
              {job.title}
            </Link>
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-body-secondary">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              {job.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0" aria-hidden />
              {job.employmentType}
            </span>
            {job.salary ? (
              <span className="flex items-center gap-1.5">
                <Wallet className="size-3.5 shrink-0" aria-hidden />
                {job.salary}
              </span>
            ) : null}
          </div>
          <span className="mt-3 inline-block rounded bg-muted px-3 py-1 text-xs font-bold uppercase tracking-wide text-body-secondary">
            {job.dept}
          </span>
        </div>

        <div className="rounded-xl border border-border-light bg-card px-6 py-6 shadow-sm sm:px-7">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
            <span className="block h-5 w-1 rounded-full bg-brand-red" aria-hidden />
            About the Role
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-body-secondary">
            {job.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border-light bg-card px-6 py-6 shadow-sm sm:px-7">
          <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
            <span className="block h-5 w-1 rounded-full bg-brand-red" aria-hidden />
            Requirements
          </h2>
          <ul className="space-y-3.5">
            {job.requirements.map((req) => (
              <li
                key={req}
                className="flex items-start gap-3 text-sm leading-relaxed text-body-secondary"
              >
                <CheckIcon />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={() => void onApply()}
          disabled={applied}
          className={cn(
            'w-full rounded-xl py-4 text-sm font-semibold tracking-wide transition-all duration-200',
            applied
              ? 'cursor-default bg-emerald-600 text-white'
              : 'bg-brand-red text-ice hover:opacity-90 active:scale-[0.99]',
          )}
        >
          {applied ? '✓ Application Submitted' : 'Apply Now'}
        </button>
      </div>
    </div>
  )
}
