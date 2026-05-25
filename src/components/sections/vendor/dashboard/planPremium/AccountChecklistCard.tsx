import { Check } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { VendorDashboardCardProps } from "../dashboardTypes";

export function AccountChecklistCard({ dashboard }: VendorDashboardCardProps) {
  const checklist = dashboard.checklist;

  return (
    <Card className="rounded-2xl border-border-light bg-card shadow-sm">
      <CardContent className="space-y-5 p-6 md:p-8">
        <h3 className="text-xl font-bold text-foreground font-manrope">Account checklist</h3>
        <ul className="space-y-4">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                  item.done
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-muted-foreground/40 bg-transparent",
                )}
                aria-hidden
              >
                {item.done ? <Check className="size-3.5 stroke-[3]" /> : null}
              </span>
              <span
                className={cn(
                  "text-sm font-inter leading-snug",
                  item.done ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
