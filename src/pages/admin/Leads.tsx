import { ChevronDown, ChevronLeft, ChevronRight, Eye, MessageSquare, Phone } from "lucide-react";
import { useMemo, useState } from "react";

import { LeadDetailsModal } from "@/components/Modal/LeadDetailsModal";
import type { LeadRow, LeadTypeFilter } from "@/components/Modal/LeadDetailsModal.types";

const TOTAL_TRANSACTIONS = 482;

const leads: LeadRow[] = [
  {
    id: 1,
    business: "Mama Put Restaurant",
    userName: "Chukwudi Okafor",
    phone: "+234 803 123 4567",
    leadType: "whatsapp",
    dateShort: "2026-04-04 14:32",
    dateTimeLong: "April 1, 2024 at 02:30 PM",
  },
  {
    id: 2,
    business: "TechHub Solutions",
    userName: "Aisha Mohammed",
    phone: "+234 805 987 6543",
    leadType: "direct_message",
    dateShort: "2026-04-04 13:45",
    dateTimeLong: "April 1, 2024 at 03:45 PM",
  },
  {
    id: 3,
    business: "Divine Salon & Spa",
    userName: "Ngozi Eze",
    phone: "+234 809 876 5432",
    leadType: "whatsapp",
    dateShort: "2026-04-04 12:18",
    dateTimeLong: "April 2, 2024 at 10:15 AM",
  },
  {
    id: 4,
    business: "Fresh Groceries Ltd",
    userName: "Ibrahim Musa",
    phone: "+234 810 345 6789",
    leadType: "direct_message",
    dateShort: "2026-04-04 11:22",
    dateTimeLong: "April 2, 2024 at 11:20 AM",
  },
  {
    id: 5,
    business: "TechHub Solutions",
    userName: "Aisha Mohammed",
    phone: "+234 805 987 6543",
    leadType: "direct_message",
    dateShort: "2026-04-04 10:15",
    dateTimeLong: "April 1, 2024 at 03:45 PM",
  },
  {
    id: 6,
    business: "Mama Put Restaurant",
    userName: "Chukwudi Okafor",
    phone: "+234 803 123 4567",
    leadType: "whatsapp",
    dateShort: "2026-04-04 09:08",
    dateTimeLong: "April 1, 2024 at 02:30 PM",
  },
];

function LeadTypeCell({ leadType }: { leadType: LeadRow["leadType"] }) {
  if (leadType === "whatsapp") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[rgb(27_175_93/0.1)] px-2.5 py-0.5 text-xs font-medium text-[#1baf5d]">
        <Phone className="size-3 shrink-0" strokeWidth={2} aria-hidden />
        WhatsApp
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
      <MessageSquare className="size-3 shrink-0" strokeWidth={2} aria-hidden />
      Direct Message
    </span>
  );
}

export default function Leads() {
  const [leadTypeFilter, setLeadTypeFilter] = useState<LeadTypeFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filteredLeads = useMemo(() => {
    if (leadTypeFilter === "all") return leads;
    return leads.filter((l) => l.leadType === leadTypeFilter);
  }, [leadTypeFilter]);

  const filterLabel =
    leadTypeFilter === "all"
      ? "Select Lead Type"
      : leadTypeFilter === "direct_message"
        ? "Direct Message"
        : "WhatsApp";

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold leading-8 text-ink-heading sm:text-2xl">Leads</h1>
      </div>

      <section className="rounded-2xl border border-border-gray bg-card p-6 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)]">
        <div className="mb-6 rounded-xl border border-chat-border-subtle bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-chat-accent">Lead Management</p>
          <p className="text-xs text-chat-meta">Track, review, and manage lead sources in the marketplace</p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <article className="rounded-lg border border-chat-border-subtle bg-card p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-chat-meta">Total Leads</p>
              <p className="mt-1 text-3xl font-semibold text-ink">342,109</p>
              <p className="text-xs font-medium text-success">+12%</p>
            </article>
            <article className="rounded-lg border border-chat-border-subtle bg-card p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-chat-meta">Conversion Rate</p>
              <p className="mt-1 text-3xl font-semibold text-ink">8.4%</p>
              <p className="text-xs font-medium text-amber-600">Stable</p>
            </article>
            <article className="rounded-lg border border-chat-border-subtle bg-card p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-chat-meta">Avg Response Time</p>
              <p className="mt-1 text-3xl font-semibold text-ink">2.1hrs</p>
              <p className="text-xs font-medium text-brand-red">+8%</p>
            </article>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative inline-block w-48">
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              className="flex h-[42px] w-full items-center justify-between rounded-xl border border-border-gray bg-card pl-[15px] pr-10 text-left text-sm font-normal text-ink"
            >
              {filterLabel}
            </button>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-5 -translate-y-1/2 text-body-secondary" />
            {filterOpen ? (
              <div className="absolute left-0 z-20 mt-2 w-full overflow-hidden rounded-xl border border-border-gray bg-card shadow-sm">
                {(["all", "whatsapp", "direct_message"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setLeadTypeFilter(key);
                      setFilterOpen(false);
                    }}
                    className="flex w-full px-3 py-2 text-left text-sm text-ink hover:bg-muted"
                  >
                    {key === "all"
                      ? "All types"
                      : key === "direct_message"
                        ? "Direct Message"
                        : key === "whatsapp"
                          ? "WhatsApp"
                          : "Direct Message"}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr className="border-b border-border-gray">
                <th className="px-4 py-3 text-left text-sm font-semibold text-body-secondary">Business</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-body-secondary">User</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-body-secondary">Lead Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-body-secondary">Timestamp</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-body-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-chat-meta">
                    No leads for this filter.
                  </td>
                </tr>
              ) : null}
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-border-light">
                  <td className="px-4 py-5 text-base font-medium text-ink">{lead.business}</td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-ink">{lead.userName}</p>
                    <p className="text-sm text-gray-500">{lead.phone}</p>
                  </td>
                  <td className="px-4 py-4">
                    <LeadTypeCell leadType={lead.leadType} />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{lead.dateShort}</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLead(lead);
                          setModalOpen(true);
                        }}
                        className="inline-flex h-8 items-center gap-2 rounded-xl px-3 text-sm font-medium text-body-secondary hover:bg-muted"
                      >
                        <Eye className="size-4 shrink-0" strokeWidth={2} />
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-tint-red/20 px-1 pb-0 pt-4">
          <p className="text-xs font-medium text-stone-700">
            Showing 1-10 of {TOTAL_TRANSACTIONS} transactions
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-lg opacity-30"
              disabled
              aria-label="Previous page"
            >
              <ChevronLeft className="size-3.5 text-stone-700" />
            </button>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-lg bg-brand-red text-xs font-semibold text-white"
            >
              1
            </button>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-lg text-xs font-semibold text-stone-700 hover:bg-muted"
            >
              2
            </button>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-lg text-xs font-semibold text-stone-700 hover:bg-muted"
            >
              3
            </button>
            <span className="px-1 text-base text-stone-700">...</span>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-lg text-xs font-semibold text-stone-700 hover:bg-muted"
            >
              49
            </button>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-lg text-stone-700 hover:bg-muted"
              aria-label="Next page"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </section>

      <LeadDetailsModal open={modalOpen} onClose={() => setModalOpen(false)} lead={selectedLead} />
    </div>
  );
}
