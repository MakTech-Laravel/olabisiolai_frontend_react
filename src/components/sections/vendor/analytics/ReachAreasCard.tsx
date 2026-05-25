import { Card, CardContent } from "@/components/ui/card";
import type { VendorAnalyticsData } from "@/features/analytics/vendorAnalyticsApi";

export function ReachAreasCard({
  reachAreas,
}: {
  reachAreas: VendorAnalyticsData["reachAreas"];
}) {
  if (reachAreas.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-4 p-5">
          <p className="text-2xl font-semibold">Top Reach Areas (LGA)</p>
          <p className="text-sm text-muted-foreground">
            Reach data will appear as customers view your profile.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <p className="text-2xl font-semibold">Top Reach Areas (LGA)</p>
        {reachAreas.map((item) => (
          <ReachAreaRow key={item.area} area={item.area} value={item.value} />
        ))}
      </CardContent>
    </Card>
  );
}

function ReachAreaRow({ area, value }: { area: string; value: number }) {
  return (
    <div className="grid grid-cols-[110px_1fr_40px] items-center gap-2 text-sm">
      <span>{area}</span>
      <div className="h-3 rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-brand-red" style={{ width: `${value}%` }} />
      </div>
      <span className="text-right text-xs font-semibold">{value}%</span>
    </div>
  );
}
