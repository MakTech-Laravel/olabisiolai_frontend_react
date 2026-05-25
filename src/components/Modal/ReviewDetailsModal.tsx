import { ShieldAlert, Star, X } from "lucide-react";

import type { ReviewDto } from "@/features/reviews/types";

export type { ReviewDto as ReviewRow } from "@/features/reviews/types";

type ReviewDetailsModalProps = {
  open: boolean;
  onClose: () => void;
  review: ReviewDto | null;
};

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1 pt-1" aria-label={`${rating} out of 5 stars`}>
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

export function ReviewDetailsModal({ open, onClose, review }: ReviewDetailsModalProps) {
  if (!open || !review) return null;

  const businessName = review.business?.business_name ?? "—";
  const isNotApproved = !review.is_approved;
  const statusLabel = review.is_approved ? "Approved" : "Flagged";
  const statusClass = review.is_approved
    ? "inline-flex rounded-full bg-[rgb(27_175_93/0.1)] px-2 py-0.5 text-xs font-medium text-[#1baf5d]"
    : "inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-card shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-details-title"
      >
        <div className="flex h-[61px] items-center justify-between border-b border-border-gray px-6">
          <h2 id="review-details-title" className="text-lg font-semibold leading-7 text-ink-heading">
            Review Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-5 items-center justify-center text-body-secondary hover:text-ink"
            aria-label="Close"
          >
            <X className="size-5" strokeWidth={2} />
          </button>
        </div>

        <div className="flex max-h-[80vh] flex-col gap-4 overflow-y-auto px-6 pb-6 pt-6">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-body-secondary">Reviewer</p>
              <p className="text-base font-normal leading-6 text-ink">{review.reviewer_name}</p>
            </div>
            <span className={statusClass}>{statusLabel}</span>
          </div>

          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-body-secondary">Business</p>
            <p className="text-base font-normal leading-6 text-ink">{businessName}</p>
          </div>

          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-body-secondary">Rating</p>
            <StarRow rating={review.rating} />
          </div>

          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-body-secondary">Review</p>
            <div className="pt-1">
              <p className="inline-block max-w-full rounded-xl bg-[rgb(27_175_93/0.1)] px-3 py-2 text-sm font-medium leading-relaxed text-[#1baf5d]">
                {review.review_text}
              </p>
            </div>
          </div>

          {isNotApproved && (
            <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 px-3 py-3">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-800">
                <ShieldAlert className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                Flagging details
              </p>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-red-700">Reason</p>
                <p className="text-sm leading-relaxed text-red-900">
                  {review.flag_reason != null && review.flag_reason.trim() !== "" ? review.flag_reason : "—"}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-red-700">Flagged at</p>
                <p className="text-sm text-red-900">
                  {review.flagged_at != null && review.flagged_at !== "" ? review.flagged_at : "—"}
                </p>
                {review.flagged_at_human != null && review.flagged_at_human !== "" && (
                  <p className="text-xs text-red-700/85">{review.flagged_at_human}</p>
                )}
              </div>

            </div>
          )}

          {review.images.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-body-secondary">Images</p>
              <div className="flex flex-wrap gap-2">
                {review.images.map((img) => (
                  <a
                    key={img.id}
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-16 w-16 overflow-hidden rounded-lg border border-border-gray bg-muted"
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
            </div>
          )}

          <div className="space-y-0.5">
            <p className="text-sm font-medium text-body-secondary">Date &amp; Time</p>
            <p className="text-base font-normal leading-6 text-ink">{review.created_at}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
