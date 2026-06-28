import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { DashboardAnalyticsCard } from "@/components/sections/vendor/dashboard/planFree/DashboardAnalyticsCard";
import { DashboardPortfolioCard } from "@/components/sections/vendor/dashboard/planFree/DashboardPortfolioCard";
import { DashboardPremiumCtaBar } from "@/components/sections/vendor/dashboard/planFree/DashboardPremiumCtaBar";
import { DashboardProfileCompletionCard } from "@/components/sections/vendor/dashboard/planFree/DashboardProfileCompletionCard";
import { DashboardRecentActivityCard } from "@/components/sections/vendor/dashboard/planFree/DashboardRecentActivityCard";
import { DashboardSupportCard } from "@/components/sections/vendor/dashboard/planFree/DashboardSupportCard";
import { DashboardVerificationCard } from "@/components/sections/vendor/dashboard/planFree/DashboardVerificationCard";
import { DashboardVisibilityBoostCard } from "@/components/sections/vendor/dashboard/planFree/DashboardVisibilityBoostCard";
import { DashboardWelcomeCard } from "@/components/sections/vendor/dashboard/planFree/DashboardWelcomeCard";
import { AccountChecklistCard } from "@/components/sections/vendor/dashboard/planPremium/AccountChecklistCard";
import { ActiveBoostsCard } from "@/components/sections/vendor/dashboard/planPremium/ActiveBoostsCard";
import { ConciergeSupportCard } from "@/components/sections/vendor/dashboard/planPremium/ConciergeSupportCard";
import { EnquiriesStatsCard } from "@/components/sections/vendor/dashboard/planPremium/EnquiriesStatsCard";
import { InteractionsListCard } from "@/components/sections/vendor/dashboard/planPremium/InteractionsListCard";
import { PremiumDashboardHeader } from "@/components/sections/vendor/dashboard/planPremium/PremiumDashboardHeader";
import { PremiumPortfolioGallery } from "@/components/sections/vendor/dashboard/planPremium/PremiumPortfolioGallery";
import { PremiumRecentActivity } from "@/components/sections/vendor/dashboard/planPremium/PremiumRecentActivity";
import { ProfileViewsStatsCard } from "@/components/sections/vendor/dashboard/planPremium/ProfileViewsStatsCard";
import { TrustScoreCard } from "@/components/sections/vendor/dashboard/planPremium/TrustScoreCard";
import { WeeklyEngagementChart } from "@/components/sections/vendor/dashboard/planPremium/WeeklyEngagementChart";
import {
  fetchVendorDashboard,
  type VendorDashboardData,
} from "@/features/dashboard/vendorDashboardApi";
import { useVendorSubscriptionAccess } from "@/hooks/useVendorSubscriptionAccess";

export default function VendorDashboard() {
  const { isPremiumActive } = useVendorSubscriptionAccess();

  const { data: dashboard, isPending, isError, error } = useQuery({
    queryKey: ["vendor", "dashboard"],
    queryFn: () => fetchVendorDashboard(),
    staleTime: 60_000,
  });

  if (isPending && !dashboard) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <Loader2 className="size-8 animate-spin text-brand" aria-hidden />
      </div>
    );
  }

  if (isError || !dashboard) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <p className="text-center text-sm text-muted-foreground">
          {(error as Error)?.message ?? "Unable to load dashboard. Please refresh the page."}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {isPremiumActive ? (
        <PremiumLayout dashboard={dashboard} />
      ) : (
        <FreeLayout dashboard={dashboard} />
      )}
    </div>
  );
}

function PremiumLayout({ dashboard }: { dashboard: VendorDashboardData }) {
  return (
    <div className="space-y-4 md:space-y-5">
      <PremiumDashboardHeader dashboard={dashboard} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TrustScoreCard dashboard={dashboard} />
        <EnquiriesStatsCard dashboard={dashboard} />
        <ProfileViewsStatsCard dashboard={dashboard} />
        <InteractionsListCard dashboard={dashboard} />
      </div>

      <WeeklyEngagementChart dashboard={dashboard} />

      <div className="grid gap-4 xl:grid-cols-2">
        <PremiumRecentActivity dashboard={dashboard} />
        <ActiveBoostsCard />
      </div>

      <PremiumPortfolioGallery dashboard={dashboard} />

      <div className="grid gap-4 xl:grid-cols-2">
        <ConciergeSupportCard />
        <AccountChecklistCard dashboard={dashboard} />
      </div>
    </div>
  );
}

function FreeLayout({ dashboard }: { dashboard: VendorDashboardData }) {
  return (
    <div className="space-y-4 md:space-y-5">
      <DashboardWelcomeCard dashboard={dashboard} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardProfileCompletionCard dashboard={dashboard} />
        <DashboardPortfolioCard dashboard={dashboard} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DashboardVisibilityBoostCard dashboard={dashboard} />
        <DashboardVerificationCard dashboard={dashboard} />
      </div>

      <DashboardAnalyticsCard dashboard={dashboard} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)]">
        <DashboardSupportCard dashboard={dashboard} />
        <DashboardRecentActivityCard dashboard={dashboard} />
      </div>

      <DashboardPremiumCtaBar />
    </div>
  );
}
