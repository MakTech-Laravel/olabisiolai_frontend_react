import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Star } from 'lucide-react'
import { Link } from 'react-router-dom'

import { request } from '@/api/request'
import type { ReviewDto } from '@/features/reviews/types'
import { cn } from '@/lib/utils'

type ProfileManageReviewsSectionProps = {
  businessId: number
  reviewsCount: number
  onNavigate?: () => void
}

async function fetchVendorReviewsPreview(): Promise<ReviewDto[]> {
  try {
    const res = await request.get('/vendor/reviews', { params: { per_page: 3 } })
    const body = res.data as { success?: boolean; data?: ReviewDto[] }
    if (body.success && Array.isArray(body.data)) return body.data
    return []
  } catch {
    return []
  }
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="inline-flex items-center gap-0.5 text-brand">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn('size-3.5', index < rating ? 'fill-brand text-brand' : 'fill-brand/15 text-brand/30')}
          aria-hidden
        />
      ))}
    </div>
  )
}

export function ProfileManageReviewsSection({
  businessId,
  reviewsCount,
  onNavigate,
}: ProfileManageReviewsSectionProps) {
  const reviewsQuery = useQuery({
    queryKey: ['vendor', 'reviews', 'manage-preview', businessId],
    queryFn: fetchVendorReviewsPreview,
    staleTime: 60_000,
  })

  const reviews = reviewsQuery.data ?? []
  const reviewsPath = `/user/business-reviews?business_id=${businessId}`

  return (
    <div className="mb-3 overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(16,22,32,0.05)]">
      <Link
        to={reviewsPath}
        onClick={onNavigate}
        className="flex items-center gap-3.5 border-b border-border-light px-4 py-[15px] transition-colors hover:bg-auth-bg"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FDEEEE] text-brand">
          <Star className="size-5" strokeWidth={2} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <b className="block text-[15px] font-semibold text-ink">Reviews</b>
          <small className="block text-[12.5px] text-chat-meta">
            {reviewsCount.toLocaleString()} review{reviewsCount === 1 ? '' : 's'} received
          </small>
        </span>
        <ChevronRight className="size-[18px] shrink-0 text-[#c3cad4]" strokeWidth={2} aria-hidden />
      </Link>

      {reviewsQuery.isLoading ? (
        <div className="px-4 py-4 text-sm text-chat-meta">Loading reviews…</div>
      ) : reviews.length > 0 ? (
        <ul className="divide-y divide-border-light">
          {reviews.map((review) => (
            <li key={review.id} className="px-4 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold text-ink">
                  {review.reviewer_name?.trim() || 'Customer'}
                </p>
                <StarRow rating={review.rating} />
              </div>
              {review.review_text ? (
                <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-chat-meta">
                  {review.review_text}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-4 text-sm text-chat-meta">No reviews yet.</p>
      )}
    </div>
  )
}
