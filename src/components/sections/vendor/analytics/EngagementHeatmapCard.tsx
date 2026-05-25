import { Card, CardContent } from "@/components/ui/card";
import type { VendorAnalyticsData } from "@/features/analytics/vendorAnalyticsApi";

const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

export function EngagementHeatmapCard({
  heatmap,
}: {
  heatmap: VendorAnalyticsData["engagementHeatmap"];
}) {
  const { grid, peakInsight } = heatmap;

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <p className="text-2xl font-semibold">Engagement Heatmap</p>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground">
          {dayLabels.map((d, index) => (
            <span key={`${d}-${index}`}>{d}</span>
          ))}
        </div>
        <div className="space-y-1.5">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-7 gap-1">
              {row.map((value, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="h-6 rounded-sm"
                  style={{ backgroundColor: `rgba(225,29,72,${value / 100})` }}
                />
              ))}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{peakInsight}</p>
      </CardContent>
    </Card>
  );
}
