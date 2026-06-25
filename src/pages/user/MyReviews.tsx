import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Star } from 'lucide-react'

import { fetchUserReviews } from '@/api/userReviews'
import { FrontendHeader } from '@/components/partials/frontend/FrontendHeader'
import { resolveActiveProfileMode } from '@/features/profile/profileViewMode'
import { useAuth } from '@/auth/useAuth'

export default function MyReviews() {
  const { user } = useAuth()
  const activeMode = resolveActiveProfileMode(user)

  const reviewsQuery = useQuery({
    queryKey: ['user-reviews'],
    queryFn: () => fetchUserReviews(1),
    enabled: activeMode === 'customer',
  })

  const reviews = reviewsQuery.data?.reviews ?? []

  return (
    <div className="min-h-screen bg-auth-bg text-ink">
      <FrontendHeader />

      <main className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
        <Link to="/user/settings" className="mb-4 inline-flex text-sm font-medium text-chat-accent hover:underline">
          ← Back to Settings & Activity
        </Link>

        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">My Reviews</h1>
        <p className="mt-1 text-sm text-body-secondary">Reviews you have written for businesses on Gidira.</p>

        {activeMode === 'vendor' ? (
          <div className="mt-6 rounded-2xl bg-card p-6 shadow-sm">
            <p className="text-sm text-body-secondary">
              Customer reviews you wrote are listed here when you are in customer mode. To manage reviews on your
              business, open{' '}
              <Link to="/user/business-reviews" className="font-semibold text-brand hover:underline">
                Reviews Received
              </Link>
              .
            </p>
          </div>
        ) : reviewsQuery.isLoading ? (
          <div className="mt-10 flex justify-center">
            <Loader2 className="size-8 animate-spin text-brand" aria-label="Loading reviews" />
          </div>
        ) : reviewsQuery.isError ? (
          <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            Could not load your reviews. Try again later.
          </p>
        ) : reviews.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-card p-6 text-center shadow-sm">
            <p className="text-sm text-body-secondary">You have not written any reviews yet.</p>
            <Link to="/filters" className="mt-4 inline-flex text-sm font-semibold text-brand hover:underline">
              Browse businesses to write a review
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-2xl bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1 text-brand">
                    {Array.from({ length: review.rating }).map((_, index) => (
                      <Star key={index} className="size-4 fill-current" aria-hidden />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-ink">{review.business_name || 'Business'}</span>
                </div>
                {review.comment ? (
                  <p className="mt-2 text-sm leading-relaxed text-body-secondary">{review.comment}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
