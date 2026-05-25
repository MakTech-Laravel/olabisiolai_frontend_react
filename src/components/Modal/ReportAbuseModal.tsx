import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Flag, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { QUERY_KEYS } from "@/constants/queryKeys";
import {
  fetchBusinessReportReasons,
  submitBusinessReport,
  type BusinessReportReasonOption,
} from "@/features/business/businessReportApi";
import { showError, showSuccess } from "@/lib/sweetAlert";
import { cn } from "@/lib/utils";

type ReportAbuseModalProps = {
  open: boolean;
  businessId: number | null;
  businessName?: string;
  onClose: () => void;
  onSubmitted?: () => void;
};

export function ReportAbuseModal({
  open,
  businessId,
  businessName,
  onClose,
  onSubmitted,
}: ReportAbuseModalProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");

  const reasonsQuery = useQuery({
    queryKey: QUERY_KEYS.businessReportReasons,
    queryFn: fetchBusinessReportReasons,
    enabled: open,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const reasons = reasonsQuery.data ?? [];

  useEffect(() => {
    if (!open) return;
    setSelectedReason("");
    setDescription("");
  }, [open, businessId]);

  useEffect(() => {
    if (!open || selectedReason || reasons.length === 0) return;
    setSelectedReason(reasons[0].value);
  }, [open, reasons, selectedReason]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (businessId === null) throw new Error("Business not found.");
      if (!selectedReason) throw new Error("Please select a reason.");
      return submitBusinessReport(businessId, {
        reason: selectedReason,
        description: description.trim() || undefined,
      });
    },
    onSuccess: async (message) => {
      await showSuccess(message);
      onSubmitted?.();
      onClose();
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Could not submit your report. Please try again.";
      void showError(message);
    },
  });

  if (!open || businessId === null) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-abuse-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-card shadow-xl sm:rounded-2xl">
        <div className="flex items-center gap-3 bg-primary px-4 py-4 text-primary-foreground">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-full hover:bg-primary-foreground/10"
            aria-label="Go back"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
          <h2 id="report-abuse-title" className="flex-1 text-center text-base font-semibold pr-9">
            Select Reason to Report Abuse
          </h2>
        </div>

        {businessName ? (
          <p className="border-b border-border-light px-5 py-3 text-sm text-body-secondary">
            Reporting: <span className="font-semibold text-ink">{businessName}</span>
          </p>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {reasonsQuery.isPending ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" aria-hidden />
              Loading reasons…
            </div>
          ) : reasons.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-destructive">
              Could not load report reasons. Please try again later.
            </p>
          ) : (
            <ul className="divide-y divide-border-light">
              {reasons.map((reason: BusinessReportReasonOption) => {
                const checked = selectedReason === reason.value;
                return (
                  <li key={reason.value}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-4 px-5 py-4 text-base text-ink transition-colors hover:bg-surface-soft",
                        checked && "bg-surface-soft/80",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                          checked ? "border-primary" : "border-border-light",
                        )}
                        aria-hidden
                      >
                        <span
                          className={cn(
                            "size-2.5 rounded-full bg-primary transition-transform",
                            checked ? "scale-100" : "scale-0",
                          )}
                        />
                      </span>
                      <input
                        type="radio"
                        name="report-reason"
                        value={reason.value}
                        checked={checked}
                        onChange={() => setSelectedReason(reason.value)}
                        className="sr-only"
                      />
                      <span className="font-medium">{reason.label}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-border-light p-4 space-y-3">
          <label className="block text-sm text-body-secondary">
            Additional details (optional)
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Tell us more about the issue…"
              className="mt-1.5 w-full resize-none rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </label>
          <Button
            type="button"
            className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
            disabled={!selectedReason || submitMutation.isPending || reasonsQuery.isPending}
            onClick={() => submitMutation.mutate()}
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Submitting…
              </>
            ) : (
              <>
                <Flag className="mr-2 size-4" aria-hidden />
                Submit report
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
