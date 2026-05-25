import { CheckCircle2, ChevronLeft, ChevronRight, Eye, Flag, Loader2, ShieldAlert, Star, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ReviewDetailsModal } from "@/components/Modal/ReviewDetailsModal";
import {
  adminDeleteReview,
  adminGetStatistics,
  adminListReviews,
  adminUpdateReview,
  adminViewReview,
} from "@/features/reviews/adminReviewApi";
import type { ReviewDto, ReviewPagination, ReviewStatistics } from "@/features/reviews/types";
import { alert, showError, showSuccess } from "@/lib/sweetAlert";

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`size-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function StatusBadge({ isApproved }: { isApproved: boolean }) {
  return isApproved ? (
    <span className="inline-flex rounded-full bg-[rgb(27_175_93/0.1)] px-2.5 py-0.5 text-xs font-medium lowercase text-[#1baf5d]">
      approved
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium lowercase text-red-700">
      flagged
    </span>
  );
}

function FlagModal({
  open,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-base font-semibold text-ink-heading">Flag Review</h3>
        <p className="mt-1 text-sm text-body-secondary">Provide a reason for flagging this review.</p>
        <textarea
          className="mt-3 w-full resize-none rounded-lg border border-border-gray bg-muted px-3 py-2 text-sm text-ink placeholder:text-placeholder-text focus:outline-none focus:ring-1 focus:ring-chat-accent-ring"
          rows={3}
          placeholder="Reason for flagging…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={loading || !reason.trim()}
            onClick={() => onConfirm(reason.trim())}
            className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Flag
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="h-9 flex-1 rounded-lg border border-border-gray text-sm font-medium text-ink-heading hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Reviews() {
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [stats, setStats] = useState<ReviewStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<ReviewPagination | null>(null);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"all" | "flagged">("all");

  const [selectedReview, setSelectedReview] = useState<ReviewDto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [flagTargetId, setFlagTargetId] = useState<number | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const data = await adminGetStatistics();
      setStats(data);
    } catch {
      // non-fatal — stats stay null
    }
  }, []);

  const loadReviews = useCallback(async (tab: "all" | "flagged", pg: number) => {
    setLoading(true);
    try {
      const params = tab === "flagged" ? { is_flagged: true, page: pg } : { page: pg };
      const result = await adminListReviews(params);
      setReviews(result.data);
      setPagination(result.pagination);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    void loadReviews(activeTab, page);
  }, [activeTab, page, loadReviews]);

  const handleTabChange = (tab: "all" | "flagged") => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleView = (review: ReviewDto) => {
    setSelectedReview(review);
    setModalOpen(true);
    void adminViewReview(review.id)
      .then((fresh) => {
        setSelectedReview(fresh);
      })
      .catch(() => {
        /* keep row snapshot if view fails */
      });
  };

  const handleApprove = async (review: ReviewDto) => {
    setProcessingId(review.id);
    try {
      const updated = await adminUpdateReview(review.id, { is_approved: true });
      setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      if (selectedReview?.id === updated.id) setSelectedReview(updated);
      void loadStats();
      showSuccess("Review approved.");
    } catch {
      showError("Could not approve review.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleFlag = async (flagReason: string) => {
    if (!flagTargetId) return;
    setProcessingId(flagTargetId);
    try {
      const updated = await adminUpdateReview(flagTargetId, {
        is_approved: false,
        flag_reason: flagReason,
      });
      setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      if (selectedReview?.id === updated.id) setSelectedReview(updated);
      void loadStats();
      showSuccess("Review flagged.");
    } catch {
      showError("Could not flag review.");
    } finally {
      setProcessingId(null);
      setFlagTargetId(null);
    }
  };

  const handleDelete = async (reviewId: number) => {
    const confirmed = await alert.confirmDelete("this review");
    if (!confirmed) return;
    setProcessingId(reviewId);
    try {
      await adminDeleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      if (selectedReview?.id === reviewId) {
        setModalOpen(false);
        setSelectedReview(null);
      }
      if (stats) {
        setStats({ ...stats, total_reviews: Math.max(0, stats.total_reviews - 1) });
      }
      alert.crud.deleted("Review");
    } catch {
      showError("Could not delete review.");
    } finally {
      setProcessingId(null);
    }
  };

  const totalPages = pagination?.last_page ?? 1;

  const positivePercent =
    stats && stats.total_reviews > 0
      ? Math.round(((stats.rating_distribution["5_star"] + stats.rating_distribution["4_star"]) / stats.total_reviews) * 100)
      : 0;
  const neutralPercent =
    stats && stats.total_reviews > 0
      ? Math.round((stats.rating_distribution["3_star"] / stats.total_reviews) * 100)
      : 0;
  const negativePercent =
    stats && stats.total_reviews > 0
      ? Math.round(((stats.rating_distribution["2_star"] + stats.rating_distribution["1_star"]) / stats.total_reviews) * 100)
      : 0;

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold leading-8 text-ink-heading sm:text-2xl">Reviews</h1>
      </div>

      <section className="mb-4 rounded-2xl border border-chat-border-subtle bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-chat-accent">Content Moderation</p>
        <h2 className="text-2xl font-semibold text-ink">Review Management</h2>
        <p className="text-sm text-chat-meta">Monitor customer reviews and user-reported businesses across the platform</p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-chat-border-subtle bg-background p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-chat-meta">Total Reviews</p>
            <p className="mt-1 text-4xl font-semibold leading-10 text-ink">
              {stats ? stats.total_reviews.toLocaleString() : "—"}
            </p>
          </article>
          <article className="rounded-xl border border-chat-border-subtle bg-background p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-chat-meta">Average Rating</p>
            <p className="mt-1 text-4xl font-semibold leading-10 text-ink">
              {stats ? stats.average_rating.toFixed(1) : "—"}
            </p>
            <p className="mt-1 text-xs font-medium text-amber-600">
              {stats ? "★".repeat(Math.round(stats.average_rating)) : ""}
            </p>
          </article>
          <article className="rounded-xl border border-chat-border-subtle bg-background p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-chat-meta">Flagged Reviews</p>
            <p className="mt-1 text-4xl font-semibold leading-10 text-ink">
              {stats ? stats.flagged_reviews : "—"}
            </p>
            {stats && stats.flagged_reviews > 0 && (
              <p className="mt-1 text-xs font-medium text-brand-red">Urgent</p>
            )}
          </article>
          <article className="rounded-xl border border-chat-border-subtle bg-background p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-chat-meta">Approved Reviews</p>
            <p className="mt-1 text-4xl font-semibold leading-10 text-ink">
              {stats ? stats.approved_reviews : "—"}
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-border-gray bg-card p-6 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)]">
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg bg-background p-2">
          {(["all", "flagged"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${activeTab === tab
                ? "bg-chat-accent text-ice"
                : "bg-card text-body-secondary hover:bg-muted"
                }`}
            >
              {tab === "all" ? "All Reviews" : "Flagged / Reported"}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse">
            <thead>
              <tr className="border-b border-border-gray">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-body-secondary">Reviewer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-body-secondary">Business</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-body-secondary">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-body-secondary">Review Excerpt</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-body-secondary">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-body-secondary">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-body-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <Loader2 className="mx-auto size-6 animate-spin text-chat-accent" />
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-chat-meta">
                    No reviews found for this filter.
                  </td>
                </tr>
              ) : (
                reviews.map((review) => {
                  const isProcessing = processingId === review.id;
                  const isNotApproved = !review.is_approved;
                  return (
                    <tr key={review.id} className="border-b border-border-light">
                      <td className="px-4 py-4">
                        <p className="text-base font-medium text-ink">{review.reviewer_name}</p>
                        <p className="text-xs text-gray-500">{review.created_at}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-ink">
                        {review.business?.business_name ?? "—"}
                      </td>
                      <td className="px-4 py-4">
                        <StarRow rating={review.rating} />
                      </td>
                      <td className="max-w-sm px-4 py-4">
                        <div className="flex items-start gap-2">
                          <p className="line-clamp-2 text-sm leading-5 text-gray-600">
                            {review.review_text}
                          </p>
                          {isNotApproved && (
                            <ShieldAlert
                              className="mt-0.5 size-4 shrink-0 text-red-600"
                              aria-label="Flagged for moderation"
                              strokeWidth={2}
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-body-secondary">{review.created_at}</td>
                      <td className="px-4 py-4">
                        <StatusBadge isApproved={review.is_approved} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleView(review)}
                            className="inline-flex size-7 items-center justify-center rounded-xl hover:bg-muted"
                            aria-label="View review"
                            disabled={isProcessing}
                          >
                            <Eye className="size-4 text-emerald-600" strokeWidth={2} />
                          </button>

                          {review.is_approved ? (
                            <button
                              type="button"
                              onClick={() => setFlagTargetId(review.id)}
                              className="inline-flex size-7 items-center justify-center rounded-xl hover:bg-muted"
                              aria-label="Flag review"
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <Loader2 className="size-4 animate-spin text-amber-600" />
                              ) : (
                                <Flag className="size-4 text-amber-600" strokeWidth={2} />
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleApprove(review)}
                              className="inline-flex size-7 items-center justify-center rounded-xl hover:bg-muted"
                              aria-label="Approve review"
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <Loader2 className="size-4 animate-spin text-emerald-600" />
                              ) : (
                                <CheckCircle2 className="size-4 text-emerald-600" strokeWidth={2} aria-hidden />
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDelete(review.id)}
                            className="inline-flex size-7 items-center justify-center rounded-xl hover:bg-muted"
                            aria-label="Delete review"
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <Loader2 className="size-4 animate-spin text-brand-red" />
                            ) : (
                              <Trash2 className="size-4 text-brand-red" strokeWidth={2} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination && totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-tint-red/20 px-1 pb-0 pt-4">
            <p className="text-xs font-medium text-stone-700">
              Showing page {pagination.current_page} of {pagination.last_page} ({pagination.total} total)
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex size-8 items-center justify-center rounded-lg disabled:opacity-30"
                aria-label="Previous page"
              >
                <ChevronLeft className="size-3.5 text-stone-700" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pg = i + 1;
                return (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setPage(pg)}
                    className={`flex size-8 items-center justify-center rounded-lg text-xs font-semibold ${page === pg
                      ? "bg-brand-red text-white"
                      : "text-stone-700 hover:bg-muted"
                      }`}
                  >
                    {pg}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="px-1 text-base text-stone-700">…</span>}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex size-8 items-center justify-center rounded-lg text-stone-700 hover:bg-muted disabled:opacity-30"
                aria-label="Next page"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-chat-border-subtle bg-card p-4">
        <h3 className="text-sm font-semibold text-ink">Sentiment Analysis</h3>
        <div className="mt-3 space-y-3">
          {[
            { label: "Positive", value: positivePercent, color: "bg-success" },
            { label: "Neutral", value: neutralPercent, color: "bg-amber-500" },
            { label: "Negative", value: negativePercent, color: "bg-brand-red" },
          ].map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-body-secondary">{item.label}</span>
                <span className="font-medium text-ink">{item.value}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <ReviewDetailsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        review={selectedReview}
      />

      <FlagModal
        open={flagTargetId !== null}
        loading={processingId === flagTargetId}
        onConfirm={handleFlag}
        onCancel={() => setFlagTargetId(null)}
      />
    </div>
  );
}
