import { Clock3, Eye, Mail, TrendingUp } from "lucide-react";

import type { VendorAnalyticsStat } from "@/features/analytics/vendorAnalyticsApi";

import { StatCard } from "./StatCard";

const statIcons = [Mail, Eye, TrendingUp, Clock3] as const;

export function StatsGrid({ stats }: { stats: VendorAnalyticsStat[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((item, index) => (
        <StatCard key={item.title} {...item} icon={statIcons[index] ?? Mail} />
      ))}
    </div>
  );
}
