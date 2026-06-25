import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, MessageSquare, PenLine, Send, Star, Store } from "lucide-react";

import { fetchUserBusinesses } from "@/api/userBusinesses";
import { request } from "@/api/request";
import { FrontendHeader } from "@/components/partials/frontend/FrontendHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ReviewDto } from "@/features/reviews/types";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="inline-flex items-center gap-0.5 text-yellow-400">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`size-3.5 ${index < rating ? "fill-yellow-400 text-yellow-400" : "fill-transparent text-slate-300"}`}
          aria-hidden
        />
      ))}
    </div>
  );
}

type ReviewStats = {
  total_reviews: number;
  average_rating: number;
  replied_reviews: number;
  unreplied_reviews: number;
  rating_distribution: {
    "5_star": number;
    "4_star": number;
    "3_star": number;
    "2_star": number;
    "1_star": number;
  };
};

async function fetchVendorReviews(businessId: number) {
  const res = await request.get("/vendor/reviews", {
    params: { business_id: businessId },
  });
  const body = res.data as {
    success: boolean;
    data: ReviewDto[];
    pagination?: { total: number };
  };

  if (body.success && Array.isArray(body.data)) {
    return {
      data: body.data,
      pagination: body.pagination || { total: body.data.length },
    };
  }

  return { data: [] as ReviewDto[], pagination: { total: 0 } };
}

async function fetchReviewStatistics(businessId: number): Promise<ReviewStats | null> {
  try {
    const res = await request.get("/vendor/reviews/statistics", {
      params: { business_id: businessId },
    });
    const body = res.data as { success: boolean; data: ReviewStats };
    return body.success && body.data ? body.data : null;
  } catch {
    return null;
  }
}

async function sendReviewReply(reviewId: number, replyText: string) {
  await request.post(`/vendor/reviews/${reviewId}/reply`, { reply_text: replyText });
}

function VendorReviewsBusinessList({
  onSelectBusiness,
}: {
  onSelectBusiness: (businessId: number) => void;
}) {
  const businessesQuery = useQuery({
    queryKey: ["user", "businesses", "vendor-reviews"],
    queryFn: fetchUserBusinesses,
    staleTime: 30_000,
  });

  const businesses = businessesQuery.data ?? [];

  const statsQueries = useQuery({
    queryKey: ["vendor", "reviews", "business-stats", businesses.map((business) => business.id)],
    queryFn: async () => {
      const rows = await Promise.all(
        businesses.map(async (business) => {
          const stats = await fetchReviewStatistics(business.id);
          return { businessId: business.id, stats };
        }),
      );
      return Object.fromEntries(rows.map((row) => [row.businessId, row.stats]));
    },
    enabled: businesses.length > 0,
    staleTime: 30_000,
  });

  if (businessesQuery.isLoading) {
    return (
      <div className="flex min-h-75 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-chat-accent" />
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <p className="rounded-xl border border-border-light bg-card px-6 py-8 text-center text-sm text-body-secondary">
        Create a business page to start receiving reviews.
      </p>
    );
  }

  if (businesses.length === 1) {
    return (
      <p className="rounded-xl border border-border-light bg-card px-6 py-8 text-center text-sm text-body-secondary">
        Opening reviews for your business…
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {businesses.map((business) => {
        const stats = statsQueries.data?.[business.id];
        const newCount = stats?.unreplied_reviews ?? 0;
        return (
          <button
            key={business.id}
            type="button"
            onClick={() => onSelectBusiness(business.id)}
            className="flex w-full items-center gap-3.5 rounded-2xl border border-border-light bg-white p-4 text-left shadow-sm transition hover:bg-auth-bg"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#EAF2FD] text-chat-accent">
              <Store className="size-5" strokeWidth={2} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <b className="block truncate text-[15px] font-semibold text-ink">{business.businessName}</b>
              <small className="mt-0.5 block text-[12.5px] text-chat-meta">
                {(stats?.total_reviews ?? 0).toLocaleString()} reviews
                {stats && stats.average_rating > 0 ? ` · ${stats.average_rating.toFixed(1)}★` : ""}
                {newCount > 0 ? ` · ${newCount} new` : ""}
              </small>
            </span>
            <ChevronRight className="size-5 shrink-0 text-chat-meta" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

function VendorReviewsDetail({ businessId }: { businessId: number }) {
  const queryClient = useQueryClient();
  const [replyLoading, setReplyLoading] = useState<number | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
  const [replyError, setReplyError] = useState<string | null>(null);
  const [showReplyInput, setShowReplyInput] = useState<Record<number, boolean>>({});

  const businessesQuery = useQuery({
    queryKey: ["user", "businesses", "vendor-reviews-detail"],
    queryFn: fetchUserBusinesses,
    staleTime: 30_000,
  });
  const businessName =
    businessesQuery.data?.find((business) => business.id === businessId)?.businessName ?? "Business";

  const reviewsQuery = useQuery({
    queryKey: ["business-reviews", businessId],
    queryFn: () => fetchVendorReviews(businessId),
    staleTime: 30_000,
  });

  const statisticsQuery = useQuery({
    queryKey: ["business-reviews-stats", businessId],
    queryFn: () => fetchReviewStatistics(businessId),
    staleTime: 30_000,
  });

  const reviews = reviewsQuery.data?.data ?? [];
  const statistics = statisticsQuery.data;
  const totalCount = statistics?.total_reviews ?? reviewsQuery.data?.pagination.total ?? 0;
  const avgRating =
    statistics && statistics.average_rating > 0
      ? Math.round(statistics.average_rating * 10) / 10
      : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map((stars) => {
    const count =
      statistics?.rating_distribution[`${stars}_star` as keyof ReviewStats["rating_distribution"]] || 0;
    return {
      stars,
      count,
      percent:
        statistics?.total_reviews && statistics.total_reviews > 0
          ? Math.round((count / statistics.total_reviews) * 100)
          : 0,
    };
  });

  const handleReply = async (reviewId: number) => {
    const replyText = replyTexts[reviewId]?.trim();
    if (!replyText) {
      setReplyError("Please enter a reply message.");
      return;
    }

    setReplyLoading(reviewId);
    setReplyError(null);

    try {
      await sendReviewReply(reviewId, replyText);
      setReplyTexts((prev) => ({ ...prev, [reviewId]: "" }));
      setShowReplyInput((prev) => ({ ...prev, [reviewId]: false }));
      await queryClient.invalidateQueries({ queryKey: ["business-reviews", businessId] });
      await queryClient.invalidateQueries({ queryKey: ["business-reviews-stats", businessId] });
    } catch {
      setReplyError("Failed to send reply. Please try again.");
    } finally {
      setReplyLoading(null);
    }
  };

  if (reviewsQuery.isLoading || statisticsQuery.isLoading) {
    return (
      <div className="flex min-h-75 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-chat-accent" />
      </div>
    );
  }

  if (reviewsQuery.isError) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        Failed to load reviews. Please try again.
      </p>
    );
  }

  return (
    <section className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4 md:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-inter text-2xl font-semibold">{businessName}</h2>
              <p className="font-inter text-base text-muted-foreground">Reviews for this business only</p>
            </div>
            <div className="text-right">
              <p className="inline-flex items-center gap-1 text-4xl font-bold">
                <Star className="size-5 fill-yellow-400 text-yellow-400" aria-hidden />
                {avgRating > 0 ? avgRating.toFixed(1) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {totalCount} review{totalCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {ratingCounts.map((row) => (
              <div key={row.stars} className="grid grid-cols-[22px_1fr_20px] items-center gap-10 text-xs">
                <span className="font-inter text-sm font-medium">{row.stars}*</span>
                <div className="h-2 rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-yellow-400" style={{ width: `${row.percent}%` }} />
                </div>
                <span className="text-right text-muted-foreground">{row.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-border-light bg-card px-6 py-8 text-center">
          <p className="text-sm text-body-secondary">No approved reviews yet.</p>
          <Button asChild variant="outline" size="sm" className="mt-4 gap-1.5">
            <Link to="/filters">
              <PenLine className="size-4" aria-hidden />
              Write a review
            </Link>
          </Button>
        </div>
      ) : (
        reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="space-y-3 p-4 md:p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {getInitials(review.reviewer_name)}
                </div>
                <div>
                  <p className="font-semibold">{review.reviewer_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {review.created_at_human ?? review.created_at}
                  </p>
                </div>
              </div>

              <StarRow rating={review.rating} />
              <p className="max-w-4xl text-sm text-foreground">{review.review_text}</p>

              {review.replies && review.replies.length > 0 ? (
                <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                  {review.replies.map((reply) => (
                    <div key={reply.id} className="rounded-lg bg-white p-3 text-sm">
                      <div className="mb-1 font-medium text-muted-foreground">Vendor Response</div>
                      <p className="text-foreground">{reply.reply_text}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{reply.created_at_human}</p>
                    </div>
                  ))}
                </div>
              ) : showReplyInput[review.id] ? (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Write your response..."
                    value={replyTexts[review.id] || ""}
                    onChange={(event) =>
                      setReplyTexts((prev) => ({ ...prev, [review.id]: event.target.value }))
                    }
                    className="min-h-20 resize-none"
                    disabled={replyLoading === review.id}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => void handleReply(review.id)}
                      disabled={replyLoading === review.id || !replyTexts[review.id]?.trim()}
                    >
                      {replyLoading === review.id ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <Send className="size-4" aria-hidden />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowReplyInput((prev) => ({ ...prev, [review.id]: false }))}
                    >
                      Cancel
                    </Button>
                  </div>
                  {replyError ? <p className="text-sm text-red-600">{replyError}</p> : null}
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReplyInput((prev) => ({ ...prev, [review.id]: true }))}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="size-4" aria-hidden />
                  Reply
                </Button>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </section>
  );
}

export default function BusinessReviews() {
  const [searchParams, setSearchParams] = useSearchParams();
  const businessIdRaw = Number(searchParams.get("business_id") ?? "");
  const selectedBusinessId =
    Number.isFinite(businessIdRaw) && businessIdRaw > 0 ? businessIdRaw : null;

  const businessesQuery = useQuery({
    queryKey: ["user", "businesses", "vendor-reviews-root"],
    queryFn: fetchUserBusinesses,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (selectedBusinessId !== null) return;
    const businesses = businessesQuery.data ?? [];
    if (businesses.length === 1) {
      const next = new URLSearchParams(searchParams);
      next.set("business_id", String(businesses[0].id));
      setSearchParams(next, { replace: true });
    }
  }, [businessesQuery.data, searchParams, selectedBusinessId, setSearchParams]);

  function selectBusiness(businessId: number) {
    const next = new URLSearchParams(searchParams);
    next.set("business_id", String(businessId));
    setSearchParams(next, { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-auth-bg text-ink">
      <FrontendHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-5 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:p-6">
        <Link
          to="/user/settings"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-chat-accent hover:underline"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Settings & Activity
        </Link>

        <header className="mb-4 mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-inter text-2xl font-semibold">Reviews Received</h1>
            <p className="text-sm text-muted-foreground">
              Pick a business inbox to view and reply to customer reviews.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0 gap-1.5">
            <Link to="/filters">
              <PenLine className="size-4" aria-hidden />
              Write a review
            </Link>
          </Button>
        </header>

        {selectedBusinessId ? (
          <VendorReviewsDetail businessId={selectedBusinessId} />
        ) : (
          <VendorReviewsBusinessList onSelectBusiness={selectBusiness} />
        )}
      </main>
    </div>
  );
}
