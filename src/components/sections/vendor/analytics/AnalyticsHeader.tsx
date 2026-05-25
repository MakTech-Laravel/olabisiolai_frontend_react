import { cn } from "@/lib/utils";
import type { VendorAnalyticsRange } from "@/features/analytics/vendorAnalyticsApi";

const ranges: { key: VendorAnalyticsRange; label: string }[] = [
  { key: "30d", label: "Last 30 Days" },
  { key: "quarter", label: "Last Quarter" },
  { key: "yearly", label: "Yearly" },
];

export function AnalyticsHeader({
  range,
  onRangeChange,
}: {
  range: VendorAnalyticsRange;
  onRangeChange: (range: VendorAnalyticsRange) => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Performance Overview</h1>
        <p className="text-sm text-muted-foreground">Real-time data for your vendor ecosystem.</p>
      </div>
      <div className="inline-flex rounded-xl border bg-background p-1 text-xs">
        {ranges.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onRangeChange(item.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 font-medium transition-colors",
              range === item.key
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
