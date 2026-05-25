import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { AnalyticsHeader } from "@/components/sections/vendor/analytics/AnalyticsHeader";
import { BasicAnalytics } from "@/components/sections/vendor/analytics/BasicAnalytics";
import { EngagementHeatmapCard } from "@/components/sections/vendor/analytics/EngagementHeatmapCard";
import { LeadsByChannelCard } from "@/components/sections/vendor/analytics/LeadsByChannelCard";
import { ReachAreasCard } from "@/components/sections/vendor/analytics/ReachAreasCard";
import { StatsGrid } from "@/components/sections/vendor/analytics/StatsGrid";
import { TopListingsTable } from "@/components/sections/vendor/analytics/TopListingsTable";
import { TrafficTrendCard } from "@/components/sections/vendor/analytics/TrafficTrendCard";
import {
  fetchVendorAnalytics,
  type VendorAnalyticsData,
  type VendorAnalyticsRange,
} from "@/features/analytics/vendorAnalyticsApi";
import { useVendorSubscriptionAccess } from "@/hooks/useVendorSubscriptionAccess";

export default function VendorAnalytics() {
  const { isPremiumActive, isLoading: subscriptionLoading } = useVendorSubscriptionAccess();
  const [range, setRange] = useState<VendorAnalyticsRange>("30d");

  const {
    data: analytics,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["vendor", "analytics", range],
    queryFn: () => fetchVendorAnalytics(range),
    staleTime: 60_000,
    enabled: !subscriptionLoading,
  });

  if (subscriptionLoading || (isPending && !analytics)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <Loader2 className="size-8 animate-spin text-brand-red" aria-label="Loading analytics" />
      </div>
    );
  }

  if (isError || !analytics) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <p className="text-center text-sm text-muted-foreground">
          {(error as Error)?.message ?? "Unable to load analytics."}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <AnalyticsPageContent
        isPremiumActive={isPremiumActive}
        analytics={analytics}
        range={range}
        onRangeChange={setRange}
      />
    </div>
  );
}

function AnalyticsPageContent({
  isPremiumActive,
  analytics,
  range,
  onRangeChange,
}: {
  isPremiumActive: boolean;
  analytics: VendorAnalyticsData;
  range: VendorAnalyticsRange;
  onRangeChange: (range: VendorAnalyticsRange) => void;
}) {
  return (
    <div className="space-y-4">
      {isPremiumActive ? (
        <PremiumAnalytics analytics={analytics} range={range} onRangeChange={onRangeChange} />
      ) : (
        <BasicAnalytics preview={analytics.preview} />
      )}
    </div>
  );
}

function PremiumAnalytics({
  analytics,
  range,
  onRangeChange,
}: {
  analytics: VendorAnalyticsData;
  range: VendorAnalyticsRange;
  onRangeChange: (range: VendorAnalyticsRange) => void;
}) {
  return (
    <>
      <AnalyticsHeader range={range} onRangeChange={onRangeChange} />
      <StatsGrid stats={analytics.stats} />
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <TrafficTrendCard trafficTrend={analytics.trafficTrend} />
        <LeadsByChannelCard leadsByChannel={analytics.leadsByChannel} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ReachAreasCard reachAreas={analytics.reachAreas} />
        <EngagementHeatmapCard heatmap={analytics.engagementHeatmap} />
      </div>
      <TopListingsTable listings={analytics.topListings} />
    </>
  );
}
