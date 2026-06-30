import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, Send, Star, Upload, X } from "lucide-react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAuthDisplayName } from "@/auth/displayName";
import { useAuth } from "@/auth/useAuth";
import { CUSTOMER_LOGIN_PATH } from "@/features/auth/loginReturn";
import { FrontendHeader } from "@/components/partials/frontend/FrontendHeader";
import { container } from "@/lib/container";
import { cn } from "@/lib/utils";
import { submitReview, invalidateBusinessReviewQueries } from "@/features/reviews/publicReviewApi";

const MAX_STARS = 5;
const MAX_REVIEW_IMAGES = 10;

type LocationState = {
  from?: string;
  business_id?: number;
  business_name?: string;
} | null;

export default function GiveReview() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const state = location.state as LocationState;
  const from = state?.from;
  const queryBusinessId = Number(searchParams.get("business_id") ?? "");
  const businessId =
    state?.business_id ??
    (Number.isFinite(queryBusinessId) && queryBusinessId > 0 ? queryBusinessId : undefined);
  const businessName = state?.business_name ?? searchParams.get("business_name");

  const { user, isAuthenticated, isUserLoading, isSessionLoading } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesId = useId();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (isUserLoading || isSessionLoading) return;
    if (!isAuthenticated) {
      navigate(CUSTOMER_LOGIN_PATH, {
        state: {
          from: {
            pathname: "/reviews",
            search: location.search,
            state: location.state,
          },
        },
      });
    }
  }, [isAuthenticated, isSessionLoading, isUserLoading, location.search, location.state, navigate]);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const displayName = getAuthDisplayName(user);

  const goBack = async () => {
    if (businessId) {
      await invalidateBusinessReviewQueries(queryClient, businessId);
    }

    if (typeof from === "string" && from.startsWith("/") && !from.startsWith("//")) {
      navigate(from);
      return;
    }
    navigate(-1);
  };

  const displayRating = hoverRating || rating;

  const onFilesChange = (list: FileList | null) => {
    if (!list?.length) return;
    const next = Array.from(list).filter((f) => /image\/(jpeg|png|webp)/i.test(f.type));
    const newFiles = [...files, ...next].slice(0, MAX_REVIEW_IMAGES);
    const added = newFiles.slice(files.length);
    const newPreviews = [...previews, ...added.map((f) => URL.createObjectURL(f))];
    setFiles(newFiles);
    setPreviews(newPreviews);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): string | null => {
    if (!businessId) return "No business selected. Please go back and try again.";
    if (rating === 0) return "Please select a star rating.";
    if (reviewText.trim().length < 10) return "Review must be at least 10 characters.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!isAuthenticated) {
      navigate(CUSTOMER_LOGIN_PATH, {
        state: {
          from: {
            pathname: "/reviews",
            search: location.search,
            state: location.state,
          },
        },
      });
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await submitReview({
        business_id: businessId!,
        full_name: displayName,
        is_anonymous: false,
        rating,
        review_text: reviewText,
        images: files.length > 0 ? files : undefined,
      });
      await invalidateBusinessReviewQueries(queryClient, businessId!);
      setSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        navigate(CUSTOMER_LOGIN_PATH, {
          state: {
            from: {
              pathname: "/reviews",
              search: location.search,
              state: location.state,
            },
          },
        });
        return;
      }
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        const data = err.response.data as {
          message?: string;
          data?: { errors?: Record<string, string[]> };
          errors?: Record<string, string[]>;
        };
        setError(data.message ?? "Validation failed. Please check the form.");
        setFieldErrors(data.data?.errors ?? data.errors ?? {});
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const pageShell = "min-h-dvh bg-bg-section pb-16 pt-6 font-sans md:pt-10";

  if (!businessId && !isUserLoading && !isSessionLoading && isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-auth-bg text-ink">
        <FrontendHeader />
        <main className={cn(container, "flex-1 py-8")}>
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-2 text-base font-normal text-chat-accent hover:underline"
          >
            <ArrowLeft className="size-6 shrink-0" aria-hidden />
            Back
          </button>
          <div className="mt-8 rounded-2xl border border-border-light/80 bg-card p-8 text-center shadow-md">
            <h1 className="text-xl font-semibold text-ink-heading">Write a Review</h1>
            <p className="mt-2 text-sm text-body-secondary">
              Choose a business from browse, open its profile, then tap Write a review.
            </p>
            <Button asChild className="mt-6">
              <Link to="/filters">Browse businesses</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (success) {
    return (
      <div className={pageShell}>
        <div className={cn(container)}>
          <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-border-light/80 bg-card p-10 shadow-md text-center">
            <CheckCircle className="size-14 text-success" strokeWidth={1.5} />
            <h1 className="text-xl font-semibold text-ink-heading">Review Submitted!</h1>
            <p className="text-sm text-body-secondary">
              Thank you for your feedback. Your review has been published.
            </p>
            <Button
              type="button"
              onClick={() => void goBack()}
              className="mt-2 h-9 gap-2 rounded-[10px] bg-footer-bar px-6 text-sm font-medium text-text-white hover:bg-footer-bar/90"
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isUserLoading || isSessionLoading || !isAuthenticated) {
    return (
      <div className={pageShell}>
        <div className={cn(container)}>
          <div className="mt-12 rounded-2xl border border-border-light/80 bg-card p-8 shadow-md text-center">
            <p className="text-sm text-body-secondary">Redirecting to sign in…</p>
            <Button type="button" variant="outline" onClick={goBack} className="mt-4">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={pageShell}>
      <div className={cn(container)}>
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-2 text-base font-normal text-chat-accent hover:underline"
        >
          <ArrowLeft className="size-6 shrink-0" aria-hidden />
          Back
        </button>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-border-light/80 bg-card p-6 shadow-md sm:p-8"
        >
          <h1 className="text-xl font-semibold leading-7 text-ink-heading">
            {businessName ? `Review for ${businessName}` : "Write a Review"}
          </h1>
          {!businessId ? (
            <p className="mt-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
              No business selected.{" "}
              <Link to="/filters" className="font-semibold underline">
                Browse businesses
              </Link>{" "}
              to pick one.
            </p>
          ) : null}

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <div className="mt-6 space-y-1">
            <p className="text-sm font-medium text-ink-heading">Your Rating</p>
            <div
              className="flex gap-2"
              role="group"
              aria-label="Star rating"
              onMouseLeave={() => setHoverRating(0)}
            >
              {Array.from({ length: MAX_STARS }, (_, i) => {
                const value = i + 1;
                const active = value <= displayRating;
                return (
                  <button
                    key={value}
                    type="button"
                    className="rounded-md p-1 text-amber-400 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chat-accent-ring"
                    aria-label={`${value} star${value > 1 ? "s" : ""}`}
                    aria-pressed={value <= rating}
                    onMouseEnter={() => setHoverRating(value)}
                    onClick={() => setRating(value)}
                  >
                    <Star
                      className={cn("size-8", active ? "fill-amber-400" : "fill-transparent")}
                      strokeWidth={1.5}
                    />
                  </button>
                );
              })}
            </div>
            {fieldErrors.rating && (
              <p className="text-xs text-red-600">{fieldErrors.rating[0]}</p>
            )}
          </div>

          <div className="mt-4 space-y-2 rounded-2xl p-4">
            <label htmlFor="review-full-name" className="text-sm font-medium text-ink-heading">
              Your name
            </label>
            <Input
              id="review-full-name"
              value={displayName}
              readOnly
              disabled
              className="h-auto cursor-default rounded-[10px] border-transparent bg-muted px-3 py-4 text-sm text-ink opacity-90 focus-visible:ring-chat-accent-ring"
            />
            <p className="text-xs text-body-secondary">Shown on your review from your account profile.</p>
            {fieldErrors.full_name && (
              <p className="text-xs text-red-600">{fieldErrors.full_name[0]}</p>
            )}
          </div>

          <div className="mt-2 space-y-2 rounded-2xl p-4">
            <label htmlFor="review-body" className="text-sm font-medium text-ink-heading">
              Your Review
            </label>
            <Textarea
              id="review-body"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this business..."
              rows={5}
              className="min-h-[152px] resize-y rounded-[10px] border-transparent bg-muted px-3 py-5 text-sm text-ink placeholder:text-placeholder-text focus-visible:ring-chat-accent-ring"
            />
            {fieldErrors.review_text && (
              <p className="text-xs text-red-600">{fieldErrors.review_text[0]}</p>
            )}
          </div>

          <div className="mt-2 space-y-2 px-4 pb-2 pt-2">
            <p className="text-base font-medium text-ink-heading">
              Images{files.length > 0 ? ` (${files.length}/${MAX_REVIEW_IMAGES})` : ""}
            </p>
            <input
              ref={fileInputRef}
              id={imagesId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={(e) => onFilesChange(e.target.files)}
            />

            {previews.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {previews.map((src, i) => (
                    <div
                      key={src}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-border-gray bg-muted"
                    >
                      <img
                        src={src}
                        alt={files[i]?.name ?? `Image ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                        aria-label={`Remove image ${i + 1}`}
                      >
                        <X className="size-3" strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                  {files.length < MAX_REVIEW_IMAGES && (
                    <label
                      htmlFor={imagesId}
                      className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border-gray bg-transparent transition-colors hover:bg-muted/30"
                    >
                      <Upload className="size-6 text-stat-muted" strokeWidth={1.5} aria-hidden />
                      <span className="text-center text-xs font-medium text-body-secondary">
                        Add more
                      </span>
                    </label>
                  )}
                </div>
              </div>
            ) : (
              <label
                htmlFor={imagesId}
                className="flex min-h-[156px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border-gray bg-transparent px-4 py-6 transition-colors hover:bg-muted/30"
              >
                <Upload className="size-12 text-stat-muted" strokeWidth={1.25} aria-hidden />
                <span className="text-center text-base font-medium text-success">
                  Click to upload images
                </span>
                <span className="text-center text-sm font-medium text-body-secondary">
                  Upload 2–10 images (JPG, PNG, WebP)
                </span>
              </label>
            )}

            {fieldErrors.images && (
              <p className="text-xs text-red-600">{fieldErrors.images[0]}</p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2 px-4">
            <Button
              type="submit"
              disabled={submitting}
              className="h-9 gap-2 rounded-[10px] bg-footer-bar px-4 text-sm font-medium text-text-white shadow-sm hover:bg-footer-bar/90 disabled:opacity-60"
            >
              <Send className="size-4" aria-hidden />
              {submitting ? "Submitting…" : "Submit Review"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={submitting}
              className="h-9 rounded-[10px] border-border/80 bg-card px-4 text-sm font-medium text-ink-heading shadow-sm hover:bg-muted/40"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
