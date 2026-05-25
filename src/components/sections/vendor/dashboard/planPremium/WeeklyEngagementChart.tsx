import { Card, CardContent } from "@/components/ui/card";
import type { VendorDashboardCardProps } from "../dashboardTypes";

export function WeeklyEngagementChart({ dashboard }: VendorDashboardCardProps) {
  const { weeklyEngagement } = dashboard;
  const days = weeklyEngagement.labels.length
    ? weeklyEngagement.labels
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const viewsHeights =
    weeklyEngagement.viewsHeights.length === days.length
      ? weeklyEngagement.viewsHeights
      : days.map(() => 0);
  const interactionsHeights =
    weeklyEngagement.interactionsHeights.length === days.length
      ? weeklyEngagement.interactionsHeights
      : days.map(() => 0);

  return (
    <Card className="rounded-2xl border-border-light bg-card shadow-sm">
      <CardContent className="space-y-6 p-6 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-xl font-bold text-foreground font-manrope">Weekly engagement activity</h3>
            <p className="mt-1 text-sm text-muted-foreground font-inter">
              Measured by cumulative user actions across all listings
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium font-inter">
            <span className="inline-flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-brand-red" />
              Views
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-sky-200" />
              Interactions
            </span>
          </div>
        </div>
        <div className="flex items-end justify-between gap-1 border-b border-border-light pb-2 pt-4 sm:gap-2">
          {days.map((day, i) => (
            <div key={`${day}-${i}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-40 w-full max-w-[48px] items-end justify-center gap-1 sm:h-44">
                <EngagementBar
                  height={viewsHeights[i] ?? 0}
                  title={`Views ${weeklyEngagement.views[i] ?? 0}`}
                  className="bg-brand-red"
                />
                <EngagementBar
                  height={interactionsHeights[i] ?? 0}
                  title={`Interactions ${weeklyEngagement.interactions[i] ?? 0}`}
                  className="bg-sky-200"
                />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground sm:text-xs">{day}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EngagementBar({
  height,
  title,
  className,
}: {
  height: number;
  title: string;
  className: string;
}) {
  return (
    <div
      className={`w-full max-w-[14px] rounded-t-md ${className}`}
      style={{ height: `${Math.max(height, 4)}%` }}
      title={title}
    />
  );
}
