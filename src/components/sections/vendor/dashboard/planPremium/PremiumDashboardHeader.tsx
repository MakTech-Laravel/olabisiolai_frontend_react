import { BadgeCheck, Star, Zap } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { visibilitySubtitle } from "@/features/dashboard/vendorDashboardApi";
import { cn } from "@/lib/utils";

import type { VendorDashboardCardProps } from "../dashboardTypes";

export function PremiumDashboardHeader({ dashboard }: VendorDashboardCardProps) {
  const { business, stats, subscription, verification, boost } = dashboard;

  return (
    <Card className="rounded-2xl border-border-light bg-card shadow-sm">
      <CardContent className="flex flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between md:px-10 md:py-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-manrope md:text-4xl">
            Welcome, {business.name}
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground font-inter md:text-lg">
            {visibilitySubtitle(stats.visibilityDeltaPercent, true)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {subscription.isPremiumActive ? (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-950",
              )}
            >
              <Star className="size-3.5 fill-amber-600 text-amber-600" aria-hidden />
              Premium
            </span>
          ) : null}
          {verification.isVerified ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-900">
              <BadgeCheck className="size-3.5 text-emerald-700" aria-hidden />
              Verified
            </span>
          ) : null}
          {boost.status === "active" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200/80 bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-900">
              <Zap className="size-3.5 text-violet-700" aria-hidden />
              Priority
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
