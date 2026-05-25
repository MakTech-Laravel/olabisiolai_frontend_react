import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, MessageCircle, Phone, X } from "lucide-react";
import { type Lead, type LeadChannel } from "./leadsData";

function splitDateTime(dateTime: string): { date: string; time: string } {
  const idx = dateTime.indexOf(" ");
  if (idx === -1) return { date: dateTime, time: "" };
  return { date: dateTime.slice(0, idx), time: dateTime.slice(idx + 1) };
}

/** e.g. `2026-04-02 10:30 AM` -> `2026-04-02 at 10:30 AM` */
function formatReceivedOnDisplay(dateTime: string): string {
  const { date, time } = splitDateTime(dateTime);
  if (!time) return date;
  return `${date} at ${time}`;
}

function modalLeadTypeLabel(channel: LeadChannel): string {
  return channel === "whatsapp" ? "WhatsApp Lead" : "Direct Message Lead";
}

export function LeadDetailsModal({
  openLead,
  onClose,
}: {
  openLead: Lead | null;
  onClose: () => void;
}) {
  if (!openLead) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={onClose}
    >
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-details-title"
        className="w-full max-w-[560px] overflow-hidden rounded-2xl border border-neutral-200/90 bg-card shadow-[0_24px_48px_-12px_rgba(15,23,42,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 pb-4 pt-6 md:px-8 md:pb-5 md:pt-8">
          <h2 id="lead-details-title" className="text-lg font-bold tracking-tight text-foreground font-manrope">
            Lead Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-neutral-100 hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" strokeWidth={2} />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6 md:space-y-7 md:px-8 md:py-8">
          <div className="flex items-center gap-4 rounded-xl bg-neutral-100/90 p-4 md:p-5">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-neutral-300/90 text-sm font-bold text-neutral-700">
              {openLead.initials}
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-base font-bold text-foreground">{openLead.name}</p>
              <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="truncate">{openLead.phone}</span>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Lead Type</p>
            <div className="inline-flex items-center gap-2">
              {openLead.channel === "whatsapp" ? (
                <MessageCircle className="size-5 shrink-0 text-emerald-600" strokeWidth={2} aria-hidden />
              ) : (
                <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <span className="text-base font-bold text-foreground">{modalLeadTypeLabel(openLead.channel)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Message</p>
            <div className="rounded-xl bg-neutral-100/90 px-4 py-3.5 text-sm leading-relaxed text-foreground md:px-5 md:py-4">
              {openLead.message}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Received On</p>
            <p className="text-sm font-medium text-foreground md:text-base">
              {formatReceivedOnDisplay(openLead.dateTime)}
            </p>
          </div>
        </div>

        <div className="border-t border-neutral-200 px-6 pb-6 pt-5 md:px-8 md:pb-8 md:pt-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <Button
              type="button"
              className="h-12 rounded-xl bg-sky-500 text-[15px] font-semibold text-white shadow-sm hover:bg-sky-500/92 [&_svg]:size-5"
            >
              <MessageCircle className="text-white" strokeWidth={2} aria-hidden />
              Contact on WhatsApp
            </Button>
            <Button
              type="button"
              className="h-12 rounded-xl border-0 bg-red-500 text-[15px] font-semibold text-white shadow-sm hover:bg-red-500/92 [&_svg]:size-5"
            >
              <Phone className="text-white" strokeWidth={2} aria-hidden />
              Call Now
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
