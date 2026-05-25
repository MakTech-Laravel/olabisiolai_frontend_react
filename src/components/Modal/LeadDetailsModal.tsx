import { X } from "lucide-react";

import type { LeadRow } from "@/components/Modal/LeadDetailsModal.types";

export type { LeadRow, LeadTypeFilter } from "@/components/Modal/LeadDetailsModal.types";

type LeadDetailsModalProps = {
  open: boolean;
  onClose: () => void;
  lead: LeadRow | null;
};

function leadTypeBadge(leadType: LeadRow["leadType"]) {
  if (leadType === "whatsapp") {
    return (
      <span className="inline-flex items-center rounded-full bg-[rgb(27_175_93/0.1)] px-2.5 py-0.5 text-xs font-medium text-[#1baf5d]">
        WhatsApp
      </span>
    );
  }
  if (leadType === "quote") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
        Quote
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
      Direct Message
    </span>
  );
}

export function LeadDetailsModal({ open, onClose, lead }: LeadDetailsModalProps) {
  if (!open || !lead) return null;

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
        aria-labelledby="lead-details-title"
      >
        <div className="flex h-[61px] items-center justify-between border-b border-border-gray px-6">
          <h2 id="lead-details-title" className="text-lg font-semibold leading-7 text-ink-heading">
            Lead Details
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

        <div className="flex flex-col gap-4 px-6 pb-6 pt-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-body-secondary">Business</p>
            <p className="text-base font-normal leading-6 text-ink">{lead.business}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-body-secondary">User</p>
            <p className="text-base font-normal leading-6 text-ink">{lead.userName}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-body-secondary">Phone</p>
            <p className="text-base font-normal leading-6 text-ink">{lead.phone}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-body-secondary">Lead Type</p>
            <div className="pt-1">{leadTypeBadge(lead.leadType)}</div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-body-secondary">Date &amp; Time</p>
            <p className="text-base font-normal leading-6 text-ink">{lead.dateTimeLong}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
