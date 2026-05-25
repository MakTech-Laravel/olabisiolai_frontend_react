import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FileText, MessageCircle } from "lucide-react";
import { type Lead, type LeadChannel } from "./leadsData";

function splitDateTime(dateTime: string): { date: string; time: string } {
  const idx = dateTime.indexOf(" ");
  if (idx === -1) return { date: dateTime, time: "" };
  return { date: dateTime.slice(0, idx), time: dateTime.slice(idx + 1) };
}

function ChannelLabel({ channel }: { channel: LeadChannel }) {
  if (channel === "whatsapp") {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-foreground">
        <MessageCircle className="size-4 shrink-0 text-emerald-600" strokeWidth={2} aria-hidden />
        <span className="font-medium">WhatsApp</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-sm text-foreground">
      <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="font-medium">Direct</span>
    </span>
  );
}

export function DirectLeadsTable({
  leads,
  onOpenLeadDetails,
}: {
  leads: Lead[];
  onOpenLeadDetails: (lead: Lead) => void;
}) {
  return (
    <Card className="overflow-hidden rounded-xl border-neutral-200/90 bg-card shadow-sm">
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              {(["User", "Lead Type", "Date & Time", "Status", "Action"] as const).map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    "px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500",
                    i === 4 && "text-center",
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  No conversations yet. Direct message threads with customers will show in this table.
                </td>
              </tr>
            ) : null}
            {leads.map((lead) => {
              const { date, time } = splitDateTime(lead.dateTime);
              return (
                <tr key={lead.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-200/90 text-xs font-semibold text-neutral-600">
                        {lead.initials}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <ChannelLabel channel={lead.channel} />
                  </td>
                  <td className="px-5 py-4 align-middle text-muted-foreground">
                    <p className="text-sm">{date}</p>
                    <p className="text-xs">{time}</p>
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <Badge
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium shadow-none",
                        lead.status === "new"
                          ? "border-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                          : "border-0 bg-neutral-200/70 text-neutral-600 hover:bg-neutral-200/70",
                      )}
                    >
                      {lead.status === "new" ? "New" : "Contacted"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-center align-middle">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-lg border-neutral-200 bg-white px-4 font-semibold text-foreground shadow-sm hover:bg-neutral-50"
                      onClick={() => onOpenLeadDetails(lead)}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
