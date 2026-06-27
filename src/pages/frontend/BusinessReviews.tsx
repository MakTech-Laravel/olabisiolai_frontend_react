import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Share2, ThumbsUp } from 'lucide-react'

import {
  fetchBusinessReviews,
  type BusinessReviewsSummary,
  type PublicReview,
} from '@/features/reviews/publicReviewApi'
import { ReviewImagesGallery } from '@/components/reviews/ReviewImagesGallery'
import { fetchPublicBusinessById } from '@/features/business/publicBusinessApi'
import { businessProfilePath } from '@/lib/businessProfile'
import { resolveBusinessIdFromSlug } from '@/lib/encryptId'
import { showError, showSuccess } from '@/lib/sweetAlert'
import { cn } from '@/lib/utils'

type ReviewFilter = 'all' | '5' | '4' | '3' | '2' | '1'
type ReviewSort = 'top' | 'recent'

function StarRow({ rating, className }: { rating: number; className?: string }) {
  const clamped = Math.min(5, Math.max(0, rating))
  return (
    <div className={cn('flex items-center gap-0.5 text-brand-red', className)} aria-hidden>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= clamped ? 'opacity-100' : 'opacity-25'}>
          ★
        </span>
      ))}
    </div>
  )
}

function helpfulStorageKey(reviewId: number) {
  return `gidira-review-helpful-${reviewId}`
}

function ReviewCard({ review, businessName, listingPath }: { review: PublicReview; businessName: string; listingPath: string }) {
  const [helpful, setHelpful] = useState(() => {
    try {
      return localStorage.getItem(helpfulStorageKey(review.id)) === '1'
    } catch {
      return false
    }
  })

  const initials = review.reviewer_name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const date = review.created_at
    ? new Date(review.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

  async function shareReview() {
    const text = `${review.reviewer_name} rated ${businessName} ${review.rating}/5 on Gidira`
    const url = `${window.location.origin}${listingPath}`
    if (navigator.share) {
      try {
        await navigator.share({ title: `Review for ${businessName}`, text, url })
        return
      } catch {
        // fall through
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`)
      showSuccess('Review link copied.')
    } catch {
      showError('Could not share this review.')
    }
  }

  function toggleHelpful() {
    const next = !helpful
    setHelpful(next)
    try {
      if (next) localStorage.setItem(helpfulStorageKey(review.id), '1')
      else localStorage.removeItem(helpfulStorageKey(review.id))
    } catch {
      // ignore
    }
  }

  return (
    <article className="border-b border-border-light py-5 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-[#EAF2FD] text-sm font-bold text-chat-accent">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-ink">{review.reviewer_name}</p>
            <p className="text-xs text-stat-muted">{date}</p>
          </div>
          <StarRow rating={review.rating} className="my-2 text-base" />
          <p className="text-sm leading-relaxed text-body-secondary">{review.review_text}</p>
          <ReviewImagesGallery images={review.images} />
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={toggleHelpful}
              className={cn(
                'inline-flex items-center gap-1.5 text-sm font-semibold transition-colors',
                helpful ? 'text-chat-accent' : 'text-body-secondary hover:text-ink',
              )}
            >
              <ThumbsUp className="size-4" aria-hidden />
              Helpful
            </button>
            <button
              type="button"
              onClick={() => void shareReview()}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-body-secondary transition-colors hover:text-ink"
            >
              <Share2 className="size-4" aria-hidden />
              Share
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function RatingBreakdown({ summary }: { summary: BusinessReviewsSummary }) {
  const total = summary.total_reviews || 1

  return (
    <div className="space-y-2">
      {summary.rating_distribution
        .slice()
        .sort((a, b) => b.stars - a.stars)
        .map((row) => {
          const pct = Math.round((row.count / total) * 100)
          return (
            <div key={row.stars} className="grid grid-cols-[52px_1fr_40px] items-center gap-3 text-sm">
              <span className="text-chat-accent">{row.stars} star</span>
              <div className="h-5 overflow-hidden rounded-full border border-border-light bg-white">
                <div
                  className="h-full rounded-full bg-[#f59e0b]"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-right text-stat-muted">{pct}%</span>
            </div>
          )
        })}
    </div>
  )
}

export default function BusinessReviews() {
  const navigate = useNavigate()
  const { slug = '' } = useParams<{ slug: string }>()
  const businessId = resolveBusinessIdFromSlug(slug)
  const [filter, setFilter] = useState<ReviewFilter>('all')
  const [sort, setSort] = useState<ReviewSort>('top')
  const [page, setPage] = useState(1)

  const listingPath = businessId ? businessProfilePath(businessId) : '/filters'

  const businessQuery = useQuery({
    queryKey: ['business', businessId],
    queryFn: () => fetchPublicBusinessById(businessId!),
    enabled: businessId !== null,
  })

  const reviewsQuery = useQuery({
    queryKey: ['business-reviews', businessId, filter, sort, page],
    queryFn: () =>
      fetchBusinessReviews(businessId!, {
        page,
        perPage: 20,
        sort,
        rating: filter === 'all' ? undefined : Number(filter),
      }),
    enabled: businessId !== null,
    placeholderData: (prev) => prev,
  })

  const business = businessQuery.data
  const reviews = reviewsQuery.data?.data ?? []
  const pagination = reviewsQuery.data?.pagination
  const summary = reviewsQuery.data?.summary

  const filterOptions = useMemo(
    () =>
      [
        { key: 'all' as const, label: 'All reviews' },
        { key: '5' as const, label: '5 stars' },
        { key: '4' as const, label: '4 stars' },
        { key: '3' as const, label: '3 stars' },
        { key: '2' as const, label: '2 stars' },
        { key: '1' as const, label: '1 star' },
      ] as const,
    [],
  )

  if (businessId === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-body-secondary">Business not found.</p>
        <Link to="/filters" className="mt-4 inline-block text-chat-accent hover:underline">
          Browse businesses
        </Link>
      </div>
    )
  }

  const average = summary?.average_rating ?? business?.rating ?? 0
  const totalReviews = summary?.total_reviews ?? business?.reviews ?? pagination?.total ?? 0

  return (
    <div className="min-h-dvh bg-bg-section pb-16">
      <div className="border-b border-border-light bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <button
            type="button"
            onClick={() => navigate(listingPath)}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-border-light bg-white"
            aria-label="Back to business"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate font-heading text-xl font-bold text-ink">Customer reviews</h1>
            <p className="truncate text-sm text-stat-muted">{business?.name ?? 'Business'}</p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start gap-6">
            <div>
              <div className="font-heading text-5xl font-extrabold leading-none text-ink">
                {average > 0 ? average.toFixed(1) : '—'}
              </div>
              <StarRow rating={average} className="mt-2 text-xl" />
              <p className="mt-2 text-sm text-stat-muted">
                {totalReviews.toLocaleString()} global {totalReviews === 1 ? 'rating' : 'ratings'}
              </p>
            </div>
            {summary ? (
              <div className="min-w-[220px] flex-1">
                <RatingBreakdown summary={summary} />
              </div>
            ) : null}
          </div>
        </section>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
            Sort by
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as ReviewSort)
                setPage(1)
              }}
              className="rounded-lg border border-border-light bg-white px-3 py-2 text-sm"
            >
              <option value="top">Top reviews</option>
              <option value="recent">Most recent</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                setFilter(option.key)
                setPage(1)
              }}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors',
                filter === option.key
                  ? 'border-chat-accent bg-chat-accent text-white'
                  : 'border-border-light bg-white text-body-secondary hover:border-chat-accent/40',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <section className="mt-5 rounded-2xl bg-white px-5 shadow-sm">
          {reviewsQuery.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-8 animate-spin text-chat-accent" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="py-10 text-center text-sm text-body-secondary">
              No reviews match this filter yet.
            </p>
          ) : (
            reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                businessName={business?.name ?? 'this business'}
                listingPath={listingPath}
              />
            ))
          )}
        </section>

        {pagination && pagination.last_page > 1 ? (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page <= 1 || reviewsQuery.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-lg border border-border-light bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-stat-muted">
              Page {pagination.current_page} of {pagination.last_page}
            </span>
            <button
              type="button"
              disabled={page >= pagination.last_page || reviewsQuery.isFetching}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-border-light bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        ) : null}
      </main>
    </div>
  )
}
