import { useState } from 'react'
import { Share2, ThumbsUp } from 'lucide-react'

import type { PublicReview } from '@/features/reviews/publicReviewApi'
import { ReviewImagesGallery } from '@/components/reviews/ReviewImagesGallery'
import { showError, showSuccess } from '@/lib/sweetAlert'
import { cn } from '@/lib/utils'

function helpfulStorageKey(reviewId: number) {
  return `gidira-review-helpful-${reviewId}`
}

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

type PublicReviewCardProps = {
  review: PublicReview
  businessName: string
  listingPath: string
  showActions?: boolean
  className?: string
}

export function PublicReviewCard({
  review,
  businessName,
  listingPath,
  showActions = true,
  className,
}: PublicReviewCardProps) {
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
    <article className={cn('border-b border-border-light py-5 last:border-b-0', className)}>
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
          {showActions ? (
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
          ) : null}
        </div>
      </div>
    </article>
  )
}
