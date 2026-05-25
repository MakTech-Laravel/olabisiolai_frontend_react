import { Loader2, X } from 'lucide-react';

import type { BusinessReportDto } from '@/features/businessReports/types';

type Props = {
  open: boolean;
  onClose: () => void;
  report: BusinessReportDto | null;
  processing?: boolean;
  onDismiss?: () => void;
  onResolve?: () => void;
};

function ReportStatusBadge({ status }: { status: BusinessReportDto['status'] }) {
  const styles =
    status === 'pending'
      ? 'bg-amber-100 text-amber-800'
      : status === 'reviewed'
        ? 'bg-[rgb(27_175_93/0.1)] text-[#1baf5d]'
        : 'bg-gray-100 text-gray-600';

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles}`}>
      {status}
    </span>
  );
}

export function BusinessReportDetailsModal({
  open,
  onClose,
  report,
  processing = false,
  onDismiss,
  onResolve,
}: Props) {
  if (!open || !report) return null;

  const canAct = report.status === 'pending';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="business-report-modal-title"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 id="business-report-modal-title" className="text-base font-semibold text-ink-heading">
              Business Report
            </h3>
            <p className="mt-0.5 text-xs text-body-secondary">{report.created_at}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-muted"
            aria-label="Close"
          >
            <X className="size-4 text-ink" />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Status</p>
            <div className="mt-1">
              <ReportStatusBadge status={report.status} />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Business</p>
            <p className="mt-1 font-medium text-ink">{report.business?.business_name ?? '—'}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Reporter</p>
            <p className="mt-1 font-medium text-ink">{report.reporter?.name ?? '—'}</p>
            {report.reporter?.email && (
              <p className="text-xs text-body-secondary">{report.reporter.email}</p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Reason</p>
            <p className="mt-1 text-ink">{report.reason_label}</p>
          </div>

          {report.description && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Details</p>
              <p className="mt-1 whitespace-pre-wrap text-ink">{report.description}</p>
            </div>
          )}

          {report.reviewed_at && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Reviewed at</p>
              <p className="mt-1 text-ink">{report.reviewed_at}</p>
            </div>
          )}
        </div>

        {canAct && (onDismiss || onResolve) && (
          <div className="mt-6 flex flex-wrap gap-2">
            {onResolve && (
              <button
                type="button"
                disabled={processing}
                onClick={onResolve}
                className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-[#1baf5d] text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                {processing && <Loader2 className="size-4 animate-spin" />}
                Mark resolved
              </button>
            )}
            {onDismiss && (
              <button
                type="button"
                disabled={processing}
                onClick={onDismiss}
                className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-border-gray text-sm font-medium text-ink-heading hover:bg-muted disabled:opacity-60"
              >
                {processing && <Loader2 className="size-4 animate-spin" />}
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
