import { Zap } from "lucide-react";

import { PremiumAccessButton } from "@/components/partials/vendor/PremiumAccessButton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useVendorSubscriptionAccess } from "@/hooks/useVendorSubscriptionAccess";
import { cn } from "@/lib/utils";
import type { VendorDashboardCardProps } from "../dashboardTypes";

const boostBadgeClass: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  inactive: "border-border text-muted-foreground",
};

export function DashboardVisibilityBoostCard({ dashboard }: VendorDashboardCardProps) {
  const { isPremiumActive } = useVendorSubscriptionAccess();
  const { boost } = dashboard;

  return (
    <Card className="w-full">
      <div className="space-y-3 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-brand-red sm:size-5" />
          <p className="font-inter text-xs font-bold text-brand-red sm:text-sm">Authority Boost</p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground font-manrope sm:text-xl">Visibility Boost</h2>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-[9px] uppercase sm:text-[10px]",
            boostBadgeClass[boost.status] ?? boostBadgeClass.inactive,
          )}
        >
          {boost.statusLabel}
        </Badge>
        <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
          Boosted vendors appear 5x more often in search results.
        </p>
        <PremiumAccessButton
          size="sm"
          boostWhenPremium
          className="w-full bg-sky-600 text-white hover:bg-sky-600/90 sm:w-auto"
        >
          {isPremiumActive ? "Explore Boosts" : "Unlock with Premium"}
        </PremiumAccessButton>
      </div>
    </Card>
  );
}
