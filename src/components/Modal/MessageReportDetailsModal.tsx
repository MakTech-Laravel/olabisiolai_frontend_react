import { Loader2, Mail, ShieldOff, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { MessageReportDto } from '@/features/messageReports/types';

type MessageReportDetailsModalProps = {
  open: boolean;
  report: MessageReportDto | null;
  processing?: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  onResolve?: () => void;
  onEmail?: (payload: { subject: string; body: string }) => void;
  onSuspend?: (note: string) => void;
};

function ReportStatusBadge({ status }: { status: MessageReportDto['status'] }) {
  const styles =
    status === 'pending'
      ? 'bg-amber-100 text-amber-800'
      : status === 'reviewed'
        ? 'bg-[rgb(27_175_93/0.1)] text-[#1baf5d]'
        : 'bg-gray-100 text-gray-600';

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium lowercase ${styles}`}>
      {status}
    </span>
  );
}

export function MessageReportDetailsModal({
  open,
  report,
  processing = false,
  onClose,
  onDismiss,
  onResolve,
  onEmail,
  onSuspend,
}: MessageReportDetailsModalProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [suspendNote, setSuspendNote] = useState('');

  useEffect(() => {
    if (!open || !report) return;
    setSubject('Important notice about your Gidira chat activity');
    setBody('');
    setSuspendNote('Suspended after admin review of reported chat message.');
  }, [open, report?.id]);

  if (!open || !report) return null;

  const canAct = report.status === 'pending';
  const reportedEmail = report.reported_user?.email;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-ink-heading">Chat report #{report.id}</h3>
            <p className="mt-0.5 text-xs text-body-secondary">{report.created_at}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-muted" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border-light p-3">
            <p className="text-xs font-semibold uppercase text-body-secondary">Reported user</p>
            <p className="mt-1 font-medium text-ink">{report.reported_user?.name ?? '-'}</p>
            <p className="text-xs text-body-secondary">{reportedEmail ?? 'No email'}</p>
            <p className="text-xs text-body-secondary">Status: {report.reported_user?.status ?? '-'}</p>
          </div>
          <div className="rounded-xl border border-border-light p-3">
            <p className="text-xs font-semibold uppercase text-body-secondary">Reporter</p>
            <p className="mt-1 font-medium text-ink">{report.reporter?.name ?? '-'}</p>
            <p className="text-xs text-body-secondary">{report.reporter?.email ?? ''}</p>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-border-light p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase text-body-secondary">Reason</p>
            <ReportStatusBadge status={report.status} />
          </div>
          <p className="mt-1 text-sm font-medium text-ink">{report.reason_label}</p>
          {report.description ? <p className="mt-2 whitespace-pre-wrap text-sm text-body-secondary">{report.description}</p> : null}
        </div>

        <div className="mt-3 rounded-xl border border-border-light p-3">
          <p className="text-xs font-semibold uppercase text-body-secondary">Reported message</p>
          <p className="mt-2 whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm text-ink">
            {report.message?.body?.trim() || '[Attachment/system message]'}
          </p>
        </div>

        <div className="mt-4 grid gap-3">
          <div className="rounded-xl border border-border-light p-3">
            <p className="text-sm font-semibold text-ink">Email reported user</p>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border-light bg-background px-3 py-2 text-sm"
              placeholder="Subject"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="mt-2 w-full resize-none rounded-lg border border-border-light bg-background px-3 py-2 text-sm"
              placeholder="Message to send by email"
            />
            <button
              type="button"
              disabled={processing || !reportedEmail || !subject.trim() || !body.trim()}
              onClick={() => onEmail?.({ subject: subject.trim(), body: body.trim() })}
              className="mt-2 inline-flex h-9 items-center gap-2 rounded-lg bg-chat-accent px-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {processing ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
              Send email
            </button>
          </div>

          <div className="rounded-xl border border-red-200 p-3">
            <p className="text-sm font-semibold text-red-700">Suspend account</p>
            <textarea
              value={suspendNote}
              onChange={(e) => setSuspendNote(e.target.value)}
              rows={2}
              className="mt-2 w-full resize-none rounded-lg border border-red-100 bg-background px-3 py-2 text-sm"
              placeholder="Admin note"
            />
            <button
              type="button"
              disabled={processing}
              onClick={() => onSuspend?.(suspendNote.trim())}
              className="mt-2 inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {processing ? <Loader2 className="size-4 animate-spin" /> : <ShieldOff className="size-4" />}
              Suspend user
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {canAct && onDismiss ? (
            <button type="button" disabled={processing} onClick={onDismiss} className="h-9 rounded-lg border border-border-gray px-3 text-sm font-medium text-ink hover:bg-muted">
              Dismiss
            </button>
          ) : null}
          {canAct && onResolve ? (
            <button type="button" disabled={processing} onClick={onResolve} className="h-9 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700">
              Resolve
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
