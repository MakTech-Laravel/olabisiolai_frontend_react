import { Crown } from "lucide-react";

import { PremiumAccessButton } from "@/components/partials/vendor/PremiumAccessButton";
import { Card, CardContent } from "@/components/ui/card";
import { formatDashboardCount } from "@/features/dashboard/vendorDashboardApi";
import type { VendorDashboardCardProps } from "../dashboardTypes";

import { StatPill } from "./StatPill";

export function DashboardAnalyticsCard({ dashboard }: VendorDashboardCardProps) {
  const { stats } = dashboard;
  const ratingLabel =
    stats.averageRating > 0 ? stats.averageRating.toFixed(1) : stats.totalReviews > 0 ? "—" : "0";

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5 md:p-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Analytics Overview
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatPill value={formatDashboardCount(stats.profileViews)} label="Profile Views" />
          <StatPill value={formatDashboardCount(stats.enquiries)} label="Lead Clicks" />
          <StatPill value={ratingLabel} label="Rating" />
          <StatPill value={`${stats.conversionRate}%`} label="Conversion" />
        </div>
        <div className="absolute inset-x-4 bottom-4 top-4 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-[2px]">
          <div className="text-center">
            <p className="inline-flex items-center gap-2 text-lg font-semibold text-foreground">
              <Crown className="size-5 text-brand-red" />
              Upgrade to Premium
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Unlock analytics, competitor tracking, and priority placement.
            </p>
            <PremiumAccessButton className="mt-3 bg-brand-red text-white hover:bg-brand-red/90">
              Get Premium Access
            </PremiumAccessButton>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
