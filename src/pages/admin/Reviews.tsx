import { CheckCircle2, ChevronLeft, ChevronRight, Eye, Flag, Loader2, ShieldAlert, Star, Trash2, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { BusinessReportDetailsModal } from "@/components/Modal/BusinessReportDetailsModal";
import { ReviewDetailsModal } from "@/components/Modal/ReviewDetailsModal";
import {
  adminDismissBusinessReport,
  adminListBusinessReports,
  adminResolveBusinessReport,
  adminViewBusinessReport,
} from "@/features/businessReports/adminBusinessReportApi";
import type { BusinessReportDto, BusinessReportPagination } from "@/features/businessReports/types";
import {
  adminDeleteReview,
  adminGetStatistics,
  adminListReviews,
  adminUpdateReview,
  adminViewReview,
} from "@/features/reviews/adminReviewApi";
import type { ReviewDto, ReviewPagination, ReviewStatistics } from "@/features/reviews/types";
import { alert, showError, showSuccess } from "@/lib/sweetAlert";

type AdminTab = "all" | "flagged" | "reports";

function BusinessReportStatusBadge({ status }: { status: BusinessReportDto["status"] }) {
  const styles =
    status === "pending"
      ? "bg-amber-100 text-amber-800"
      : status === "reviewed"
        ? "bg-[rgb(27_175_93/0.1)] text-[#1baf5d]"
        : "bg-gray-100 text-gray-600";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium lowercase ${styles}`}>
      {status}
    </span>
  );
}

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
  const [businessReports, setBusinessReports] = useState<BusinessReportDto[]>([]);
  const [stats, setStats] = useState<ReviewStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<ReviewPagination | null>(null);
  const [reportPagination, setReportPagination] = useState<BusinessReportPagination | null>(null);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<AdminTab>("all");

  const [selectedReview, setSelectedReview] = useState<ReviewDto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<BusinessReportDto | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
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
      setReportPagination(null);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBusinessReports = useCallback(async (pg: number) => {
    setLoading(true);
    try {
      const result = await adminListBusinessReports({ page: pg, per_page: 15 });
      setBusinessReports(result.data);
      setReportPagination(result.pagination);
      setPagination(null);
      setReviews([]);
    } catch {
      setBusinessReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (activeTab === "reports") {
      void loadBusinessReports(page);
    } else {
      void loadReviews(activeTab, page);
    }
  }, [activeTab, page, loadReviews, loadBusinessReports]);

  const handleTabChange = (tab: AdminTab) => {
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

  const handleViewReport = (report: BusinessReportDto) => {
    setSelectedReport(report);
    setReportModalOpen(true);
    void adminViewBusinessReport(report.id)
      .then((fresh) => setSelectedReport(fresh))
      .catch(() => {
        /* keep row snapshot */
      });
  };

  const handleDismissReport = async (reportId: number) => {
    setProcessingId(reportId);
    try {
      const updated = await adminDismissBusinessReport(reportId);
      setBusinessReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      if (selectedReport?.id === updated.id) setSelectedReport(updated);
      void loadStats();
      showSuccess("Report dismissed.");
    } catch {
      showError("Could not dismiss report.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleResolveReport = async (reportId: number) => {
    setProcessingId(reportId);
    try {
      const updated = await adminResolveBusinessReport(reportId);
      setBusinessReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      if (selectedReport?.id === updated.id) setSelectedReport(updated);
      void loadStats();
      showSuccess("Report marked as resolved.");
    } catch {
      showError("Could not resolve report.");
    } finally {
      setProcessingId(null);
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

  const totalPages =
    activeTab === "reports" ? (reportPagination?.last_page ?? 1) : (pagination?.last_page ?? 1);
  const listTotal =
    activeTab === "reports" ? (reportPagination?.total ?? 0) : (pagination?.total ?? 0);
  const listCurrentPage =
    activeTab === "reports" ? (reportPagination?.current_page ?? 1) : (pagination?.current_page ?? 1);

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
            <p className="text-[11px] font-semibold uppercase tracking-wide text-chat-meta">Business Reports</p>
            <p className="mt-1 text-4xl font-semibold leading-10 text-ink">
              {stats?.pending_business_reports != null ? stats.pending_business_reports : "—"}
            </p>
            {stats && (stats.pending_business_reports ?? 0) > 0 && (
              <p className="mt-1 text-xs font-medium text-brand-red">Pending review</p>
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
          {(
            [
              { id: "all" as const, label: "All Reviews" },
              { id: "flagged" as const, label: "Flagged Reviews" },
              { id: "reports" as const, label: "Business Reports" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${activeTab === tab.id
                ? "bg-chat-accent text-ice"
                : "bg-card text-body-secondary hover:bg-muted"
                }`}
            >
              {tab.label}
              {tab.id === "reports" && stats && (stats.pending_business_reports ?? 0) > 0 && (
                <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold text-white">
                  {stats.pending_business_reports}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          {activeTab === "reports" ? (
            <table className="w-full min-w-[960px] border-collapse">
              <thead>
                <tr className="border-b border-border-gray">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-body-secondary">Reporter</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-body-secondary">Business</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-body-secondary">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-body-secondary">Details</th>
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
                ) : businessReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-chat-meta">
                      No business reports yet.
                    </td>
                  </tr>
                ) : (
                  businessReports.map((report) => {
                    const isProcessing = processingId === report.id;
                    const isPending = report.status === "pending";
                    return (
                      <tr key={report.id} className="border-b border-border-light">
                        <td className="px-4 py-4">
                          <p className="text-base font-medium text-ink">{report.reporter?.name ?? "—"}</p>
                          <p className="text-xs text-gray-500">{report.reporter?.email ?? ""}</p>
                        </td>
                        <td className="px-4 py-4 text-sm font-medium text-ink">
                          {report.business?.business_name ?? "—"}
                        </td>
                        <td className="px-4 py-4 text-sm text-ink">{report.reason_label}</td>
                        <td className="max-w-xs px-4 py-4">
                          <p className="line-clamp-2 text-sm text-gray-600">
                            {report.description?.trim() || "—"}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-xs text-body-secondary">{report.created_at}</td>
                        <td className="px-4 py-4">
                          <BusinessReportStatusBadge status={report.status} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewReport(report)}
                              className="inline-flex size-7 items-center justify-center rounded-xl hover:bg-muted"
                              aria-label="View report"
                              disabled={isProcessing}
                            >
                              <Eye className="size-4 text-emerald-600" strokeWidth={2} />
                            </button>
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleResolveReport(report.id)}
                                  className="inline-flex size-7 items-center justify-center rounded-xl hover:bg-muted"
                                  aria-label="Resolve report"
                                  disabled={isProcessing}
                                >
                                  {isProcessing ? (
                                    <Loader2 className="size-4 animate-spin text-emerald-600" />
                                  ) : (
                                    <CheckCircle2 className="size-4 text-emerald-600" strokeWidth={2} />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDismissReport(report.id)}
                                  className="inline-flex size-7 items-center justify-center rounded-xl hover:bg-muted"
                                  aria-label="Dismiss report"
                                  disabled={isProcessing}
                                >
                                  {isProcessing ? (
                                    <Loader2 className="size-4 animate-spin text-stone-500" />
                                  ) : (
                                    <XCircle className="size-4 text-stone-500" strokeWidth={2} />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
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
          )}
        </div>

        {(pagination || reportPagination) && totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-tint-red/20 px-1 pb-0 pt-4">
            <p className="text-xs font-medium text-stone-700">
              Showing page {listCurrentPage} of {totalPages} ({listTotal} total)
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

      <BusinessReportDetailsModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        report={selectedReport}
        processing={selectedReport != null && processingId === selectedReport.id}
        onDismiss={
          selectedReport?.status === "pending"
            ? () => handleDismissReport(selectedReport.id)
            : undefined
        }
        onResolve={
          selectedReport?.status === "pending"
            ? () => handleResolveReport(selectedReport.id)
            : undefined
        }
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
