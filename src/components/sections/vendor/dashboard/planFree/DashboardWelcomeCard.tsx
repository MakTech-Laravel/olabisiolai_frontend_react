import { Card, CardContent } from "@/components/ui/card";
import { visibilitySubtitle } from "@/features/dashboard/vendorDashboardApi";

import WelcomeImage from "@/assets/Container (7).png";
import type { VendorDashboardCardProps } from "../dashboardTypes";

export function DashboardWelcomeCard({ dashboard }: VendorDashboardCardProps) {
  const { business, stats } = dashboard;

  return (
    <Card className="border-border-light bg-card">
      <CardContent className="flex items-start justify-between gap-4 p-4 xl:p-10">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground font-manrope">
            Welcome, {business.name}
          </h2>
          <p className="max-w-2xl text-lg font-normal text-muted-foreground font-inter">
            {visibilitySubtitle(stats.visibilityDeltaPercent, false)}
          </p>
        </div>
        <div className="hidden rounded-lg sm:block">
          <img src={WelcomeImage} alt="vendor-dashboard-avatar" />
        </div>
      </CardContent>
    </Card>
  );
}
