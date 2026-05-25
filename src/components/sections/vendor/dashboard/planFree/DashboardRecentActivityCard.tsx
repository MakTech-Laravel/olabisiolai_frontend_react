import type { LucideIcon } from "lucide-react";
import { ChevronRight, Eye, MessageCircle, Star } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { VendorDashboardActivity } from "@/features/dashboard/vendorDashboardApi";
import type { VendorDashboardCardProps } from "../dashboardTypes";

type ActivityItem = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
};

function iconForActivity(title: string): LucideIcon {
  const lower = title.toLowerCase();
  if (lower.includes("review")) return Star;
  if (lower.includes("enquiry") || lower.includes("message")) return MessageCircle;
  return Eye;
}

function mapActivity(item: VendorDashboardActivity): ActivityItem {
  return {
    title: item.title,
    subtitle: item.subtitle,
    icon: iconForActivity(item.title),
  };
}

export function DashboardRecentActivityCard({ dashboard }: VendorDashboardCardProps) {
  const activities = dashboard.recentActivity.slice(0, 3).map(mapActivity);

  return (
    <Card className="flex flex-col overflow-hidden rounded-xl border-border-light shadow-sm">
      <div className="border-b border-border px-6 pb-4 pt-6 md:px-8 md:pb-5 md:pt-8">
        <h3 className="text-xl font-bold text-foreground font-manrope">Recent Activity</h3>
      </div>
      <div className="flex-1 divide-y divide-border">
        {activities.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted-foreground md:px-8">No recent activity yet.</p>
        ) : (
          activities.map((activity) => {
            const ActivityIcon = activity.icon;
            return (
              <button
                key={activity.title}
                type="button"
                className="flex w-full items-center gap-3 px-6 py-3.5 text-left transition-colors hover:bg-muted/40 md:px-8 md:py-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center text-brand-red">
                  <ActivityIcon className="size-5 shrink-0" strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.subtitle}</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            );
          })
        )}
      </div>
      <div className="border-t border-border bg-indigo-50/90 px-4 py-3 dark:bg-indigo-950/40">
        <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-foreground">
          Showing last {activities.length || 0} activities
        </p>
      </div>
    </Card>
  );
}
