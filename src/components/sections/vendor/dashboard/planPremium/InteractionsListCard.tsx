import { Globe, MessageCircle, Phone } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatDashboardCount } from "@/features/dashboard/vendorDashboardApi";
import type { VendorDashboardCardProps } from "../dashboardTypes";

const iconByKey = {
  calls: Phone,
  whatsapp: MessageCircle,
  website: Globe,
} as const;

export function InteractionsListCard({ dashboard }: VendorDashboardCardProps) {
  const rows = dashboard.interactions.length
    ? dashboard.interactions
    : [
      { key: "calls", label: "Calls", count: 0 },
      { key: "whatsapp", label: "WhatsApp", count: 0 },
      { key: "website", label: "Website", count: 0 },
    ];

  return (
    <Card className="rounded-2xl border-border-light bg-card shadow-sm">
      <CardContent className="space-y-4 p-6 md:p-8">
        <h3 className="text-lg font-bold text-foreground font-manrope">Interactions</h3>
        <ul className="space-y-3">
          {rows.map((row) => {
            const Icon = iconByKey[row.key as keyof typeof iconByKey] ?? MessageCircle;
            return (
              <li
                key={row.key}
                className="flex items-center justify-between gap-3 border-b border-border-light pb-3 last:border-0 last:pb-0"
              >
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground font-inter">
                  <Icon className="size-4 shrink-0 text-primary" aria-hidden />
                  {row.label}
                </span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {formatDashboardCount(row.count)}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
