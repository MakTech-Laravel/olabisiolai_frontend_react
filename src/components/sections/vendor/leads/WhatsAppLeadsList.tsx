import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import type { Lead } from "./leadsData";

export function WhatsAppLeadsList({
  leads,
  selectedLeadId,
  onSelectLead,
  searchQuery = "",
  onSearchChange,
  onNewConversation,
}: {
  leads: Lead[];
  selectedLeadId: string;
  onSelectLead: (id: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onNewConversation?: () => void;
}) {
  const selectedLead = leads.find((lead) => lead.id === selectedLeadId);

  return (
    <div className="border-b border-neutral-200 bg-[#F3F3FE] lg:border-b-0 lg:border-r">
      <div className="space-y-4 p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-foreground">Messages</h2>
          {onNewConversation ? (
            <Button
              type="button"
              size="sm"
              className="h-8 shrink-0 rounded-full bg-sky-600 px-3 text-xs text-white hover:bg-sky-600/90"
              onClick={onNewConversation}
            >
              New
            </Button>
          ) : null}
        </div>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            className="h-10 rounded-full border border-neutral-200 bg-white pl-10 pr-4 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-sky-500/25"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          {leads.length === 0 ? (
            <p className="rounded-lg bg-white/80 px-3 py-8 text-center text-sm text-muted-foreground">
              {searchQuery.trim()
                ? "No conversations match your search."
                : "No direct messages yet. When customers message you, they will appear here."}
            </p>
          ) : null}
          {leads.map((lead) => {
            const active = selectedLead?.id === lead.id;
            return (
              <button
                key={lead.id}
                type="button"
                onClick={() => onSelectLead(lead.id)}
                className={cn(
                  "relative w-full rounded-lg py-2.5 pl-3 pr-2 text-left transition-colors",
                  active ? "bg-sky-50 shadow-sm" : "hover:bg-white/90",
                )}
              >
                {active ? (
                  <span
                    className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-sky-600"
                    aria-hidden
                  />
                ) : null}
                <div className="flex items-start gap-3 pl-2">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-200/90 text-xs font-semibold text-neutral-700">
                    {lead.initials}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-foreground">{lead.name}</span>
                        {lead.online ? (
                          <span className="inline-flex size-2 shrink-0 rounded-full bg-emerald-500 ring-2 ring-white" title="Online" />
                        ) : null}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{lead.lastSeen}</span>
                    </div>
                    <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">{lead.message}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
