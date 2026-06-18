import { Lock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { VendorAnalyticsData } from "@/features/analytics/vendorAnalyticsApi";
import { useVendorSubscriptionAccess } from "@/hooks/useVendorSubscriptionAccess";

export function BasicAnalytics({
  preview,
}: {
  preview: VendorAnalyticsData["preview"];
}) {
  const { goToPremiumPayment } = useVendorSubscriptionAccess();

  const stats = [
    { label: "Total Views", value: preview.totalViews },
    { label: "Total Bookings", value: preview.totalBookings },
    { label: "Reviews", value: preview.reviews },
    { label: "Conversion", value: preview.conversion },
  ];

  return (
    <div className="relative">
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-white/40 p-8">
        <div className="flex h-13 w-13 items-center justify-center rounded-full bg-brand-red p-3">
          <Lock className="h-6 w-6 text-popover-foreground" />
        </div>
        <p className="text-lg font-semibold text-popover-foreground">Upgrade to Premium</p>
        <p className="max-w-[260px] text-center text-sm text-popover-foreground">
          Unlock deep analytics, conversion tracking, and competitor benchmarks.
        </p>
        <button
          type="button"
          onClick={() => goToPremiumPayment()}
          className="cursor-pointer rounded-full bg-red-600 px-6 py-3 text-sm font-medium text-text-white hover:bg-brand-red"
        >
          Get Premium Access
        </button>
      </div>

      <Card className="h-screen opacity-40">
        <CardContent className="p-6">
          <h2 className="mb-5 font-inter text-xl font-bold">Analytics Dashboard</h2>

          <div className="mb-5 grid grid-cols-4 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-lg bg-muted p-4">
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  {s.label}
                </p>
                <p className="text-2xl font-semibold">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="relative min-h-[240px] overflow-hidden rounded-lg border">
            <div className="pointer-events-none flex h-48 items-end gap-2 p-4 opacity-30 blur-sm">
              {preview.chartHeights.map((h, i) => (
                <div key={i} className="flex-1 rounded-t bg-red-500" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
