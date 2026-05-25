import { Loader2, Star, MessageSquare, Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ReviewDto } from "@/features/reviews/types";
import { request } from "@/api/request";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="inline-flex items-center gap-0.5 text-yellow-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${i < rating ? "fill-yellow-400 text-yellow-400" : "fill-transparent text-slate-300"}`}
        />
      ))}
    </div>
  );
}


async function fetchVendorReviews(): Promise<{ data: ReviewDto[]; pagination: { total: number } }> {
  try {
    const res = await request.get("/vendor/reviews");
    const body = res.data as {
      success: boolean;
      data: ReviewDto[];
      pagination?: { total: number; current_page: number; last_page: number; per_page: number }
    };

    // Handle the response structure shown in the image
    if (body.success && Array.isArray(body.data)) {
      return {
        data: body.data,
        pagination: body.pagination || { total: body.data.length }
      };
    }

    return {
      data: [],
      pagination: { total: 0 }
    };
  } catch {
    return {
      data: [],
      pagination: { total: 0 }
    };
  }
}

async function sendReviewReply(reviewId: number, replyText: string): Promise<boolean> {
  try {
    await request.post(`/vendor/reviews/${reviewId}/reply`, { reply_text: replyText });
    return true;
  } catch (error) {
    console.error(`Failed to send reply for review ${reviewId}:`, error);
    return false;
  }
}

async function fetchReviewStatistics(): Promise<{
  total_reviews: number;
  average_rating: number;
  replied_reviews: number;
  unreplied_reviews: number;
  rating_distribution: {
    '5_star': number;
    '4_star': number;
    '3_star': number;
    '2_star': number;
    '1_star': number;
  };
} | null> {
  try {
    const res = await request.get("/vendor/reviews/statistics");
    const body = res.data as { success: boolean; data: any };
    if (body.success && body.data) {
      return body.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch review statistics:', error);
    return null;
  }
}

export default function VendorReviews() {
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [replyLoading, setReplyLoading] = useState<number | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
  const [replyError, setReplyError] = useState<string | null>(null);
  const [showReplyInput, setShowReplyInput] = useState<Record<number, boolean>>({});
  const [statistics, setStatistics] = useState<{
    total_reviews: number;
    average_rating: number;
    replied_reviews: number;
    unreplied_reviews: number;
    rating_distribution: {
      '5_star': number;
      '4_star': number;
      '3_star': number;
      '2_star': number;
      '1_star': number;
    };
  } | null>(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchVendorReviews();
      setReviews(result.data);
      setTotalCount(result.pagination.total);
      if (result.data.length > 0) {
        const avg = result.data.reduce((sum: number, r: ReviewDto) => sum + r.rating, 0) / result.data.length;
        setAvgRating(Math.round(avg * 10) / 10);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      setError("Failed to load reviews. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStatistics = useCallback(async () => {
    try {
      const stats = await fetchReviewStatistics();
      if (stats) {
        setStatistics(stats);
        setTotalCount(stats.total_reviews);
        setAvgRating(Math.round(stats.average_rating * 10) / 10);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }, []);

  useEffect(() => {
    void loadReviews();
    void loadStatistics();
  }, [loadReviews, loadStatistics]);

  const handleReply = async (reviewId: number) => {
    const replyText = replyTexts[reviewId]?.trim();
    if (!replyText) {
      setReplyError("Please enter a reply message.");
      return;
    }

    setReplyLoading(reviewId);
    setReplyError(null);

    try {
      const success = await sendReviewReply(reviewId, replyText);
      if (success) {
        // Clear the reply text for this review
        setReplyTexts(prev => ({ ...prev, [reviewId]: "" }));
        // Reload reviews + statistics in parallel to reduce waiting time
        await Promise.all([loadReviews(), loadStatistics()]);
      } else {
        setReplyError("Failed to send reply. Please try again.");
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      setReplyError("Failed to send reply. Please try again.");
    } finally {
      setReplyLoading(null);
    }
  };

  const ratingCounts = [5, 4, 3, 2, 1].map((stars) => {
    const count = statistics?.rating_distribution[`${stars}_star` as keyof typeof statistics.rating_distribution] || 0;
    return {
      stars,
      count,
      percent:
        statistics?.total_reviews && statistics.total_reviews > 0
          ? Math.round((count / statistics.total_reviews) * 100)
          : 0,
    };
  });

  if (loading) {
    return (
      <div className="flex min-h-75 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-chat-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <section className="space-y-4">
        <Card>
          <CardContent className="space-y-4 p-4 md:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-inter text-2xl font-semibold">Customer Reviews</h2>
                <p className="font-inter text-base text-muted-foreground">
                  Manage and respond to customer feedback
                </p>
              </div>
              <div className="text-right">
                <p className="inline-flex items-center gap-1 text-4xl font-bold">
                  <Star className="size-5 fill-yellow-400 text-yellow-400" />
                  {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                </p>
                <p className="text-xs text-muted-foreground">{totalCount} review{totalCount !== 1 ? "s" : ""}</p>
              </div>
            </div>

            <div className="space-y-2">
              {ratingCounts.map((row) => (
                <div
                  key={row.stars}
                  className="grid grid-cols-[22px_1fr_20px] items-center gap-10 text-xs"
                >
                  <span className="font-inter text-sm font-medium">{row.stars}*</span>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-yellow-400"
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                  <span className="text-right text-muted-foreground">{row.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {reviews.length === 0 ? (
          <p className="rounded-xl border border-border-light bg-card px-6 py-8 text-center text-sm text-body-secondary">
            No approved reviews yet.
          </p>
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
                    <p className="text-xs text-muted-foreground">{review.created_at}</p>
                  </div>
                </div>

                <StarRow rating={review.rating} />

                <p className="max-w-4xl text-sm text-foreground">{review.review_text}</p>

                {review.images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {review.images.map((img) => (
                      <a
                        key={img.id}
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block h-14 w-14 overflow-hidden rounded-lg border border-border-gray bg-muted"
                      >
                        <img
                          src={img.url}
                          alt={img.original_filename}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </a>
                    ))}
                  </div>
                )}

                {/* Display existing replies */}
                {review.replies && review.replies.length > 0 && (
                  <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <MessageSquare className="size-4" />
                      {review.replies_count} {review.replies_count === 1 ? 'Reply' : 'Replies'}
                    </div>
                    {review.replies.map((reply) => (
                      <div key={reply.id} className="rounded-lg bg-white p-3 text-sm">
                        <div className="mb-1 font-medium text-muted-foreground">Vendor Response</div>
                        <p className="text-foreground">{reply.reply_text}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{reply.created_at_human}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply input form - only show if no replies exist (one-time reply constraint) */}
                {(!review.replies || review.replies.length === 0) && (
                  <div className="space-y-2">
                    {showReplyInput[review.id] ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <MessageSquare className="size-4" />
                          Reply to this review
                        </div>
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Write your response..."
                            value={replyTexts[review.id] || ""}
                            onChange={(e) => setReplyTexts(prev => ({ ...prev, [review.id]: e.target.value }))}
                            className="min-h-20 resize-none"
                            disabled={replyLoading === review.id}
                          />
                          <Button
                            onClick={() => handleReply(review.id)}
                            disabled={replyLoading === review.id || !replyTexts[review.id]?.trim()}
                            className="self-end"
                          >
                            {replyLoading === review.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Send className="size-4" />
                            )}
                          </Button>
                        </div>
                        {replyError && (
                          <p className="text-sm text-red-600">{replyError}</p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowReplyInput(prev => ({ ...prev, [review.id]: false }))}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setShowReplyInput(prev => ({ ...prev, [review.id]: true }))}
                        className="flex items-center gap-2"
                      >
                        <MessageSquare className="size-4" />
                        Reply
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
