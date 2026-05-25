import { Card, CardContent } from "@/components/ui/card";
import type { VendorAnalyticsData } from "@/features/analytics/vendorAnalyticsApi";

const channelDotClass: Record<string, string> = {
  "brand-red": "bg-brand-red",
  "slate-900": "bg-slate-900",
  "sky-700": "bg-sky-700",
  "slate-400": "bg-slate-400",
};

export function LeadsByChannelCard({
  leadsByChannel,
}: {
  leadsByChannel: VendorAnalyticsData["leadsByChannel"];
}) {
  const { dominantPercent, dominantLabel, channels, conicGradient } = leadsByChannel;

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <p className="text-2xl font-semibold">Leads by Channel</p>
        <div
          className="mx-auto flex size-44 items-center justify-center rounded-full"
          style={{ background: conicGradient }}
        >
          <div className="flex size-32 flex-col items-center justify-center rounded-full bg-background">
            <p className="text-4xl font-bold">{dominantPercent}%</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {dominantLabel}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {channels.map((channel) => (
            <p key={channel.key} className="inline-flex items-center gap-2">
              <span
                className={`size-2 rounded-full ${channelDotClass[channel.color] ?? "bg-slate-400"}`}
              />
              {channel.label} ({channel.percent}%)
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
