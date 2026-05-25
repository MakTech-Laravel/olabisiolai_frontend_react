import { request } from "@/api/request";
import {
  formatDashboardCount,
  formatDashboardDelta,
} from "@/features/dashboard/vendorDashboardApi";

type RawRecord = Record<string, unknown>;

export type VendorAnalyticsRange = "30d" | "quarter" | "yearly";

export type VendorAnalyticsStat = {
  title: string;
  value: string;
  delta: string;
  up: boolean;
};

export type VendorAnalyticsChannel = {
  key: string;
  label: string;
  percent: number;
  color: string;
};

export type VendorAnalyticsListing = {
  name: string;
  views: string;
  clicks: string;
  ctr: string;
  enquiries: string;
  status: string;
};

export type VendorAnalyticsData = {
  range: VendorAnalyticsRange;
  rangeLabel: string;
  stats: VendorAnalyticsStat[];
  trafficTrend: {
    viewsHeights: number[];
    enquiriesHeights: number[];
    highlightIndex: number;
  };
  leadsByChannel: {
    dominantPercent: number;
    dominantLabel: string;
    channels: VendorAnalyticsChannel[];
    conicGradient: string;
  };
  reachAreas: { area: string; value: number }[];
  engagementHeatmap: {
    grid: number[][];
    peakInsight: string;
  };
  topListings: VendorAnalyticsListing[];
  preview: {
    totalViews: string;
    totalBookings: string;
    reviews: string;
    conversion: string;
    chartHeights: number[];
  };
};

function asRecord(value: unknown): RawRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as RawRecord)
    : null;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function pickString(record: RawRecord, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return fallback;
}

function pickBool(record: RawRecord, keys: string[]): boolean {
  for (const key of keys) {
    if (typeof record[key] === "boolean") return record[key] as boolean;
  }
  return false;
}

function unwrapData(res: { data: unknown }): RawRecord {
  const root = asRecord(res.data);
  if (!root || root.success !== true) {
    const message =
      (typeof root?.message === "string" && root.message) || "Unable to load analytics.";
    throw new Error(message);
  }
  return asRecord(root.data) ?? {};
}

function formatPercent(value: number): string {
  return `${value.toFixed(1).replace(/\.0$/, "")}%`;
}

function formatCount(value: number): string {
  return formatDashboardCount(value);
}

function buildConicGradient(channels: VendorAnalyticsChannel[]): string {
  if (channels.length === 0) {
    return "conic-gradient(#e11d48 0 48%, #dbe3f7 48% 100%)";
  }

  const colors: Record<string, string> = {
    "brand-red": "#e11d48",
    "slate-900": "#0f172a",
    "sky-700": "#0369a1",
    "slate-400": "#94a3b8",
  };

  let cursor = 0;
  const stops: string[] = [];

  for (const channel of channels) {
    const color = colors[channel.color] ?? "#dbe3f7";
    const next = cursor + channel.percent;
    stops.push(`${color} ${cursor}% ${next}%`);
    cursor = next;
  }

  if (cursor < 100) {
    stops.push(`#dbe3f7 ${cursor}% 100%`);
  }

  return `conic-gradient(${stops.join(", ")})`;
}

function parseStats(raw: RawRecord): VendorAnalyticsStat[] {
  const stats = asRecord(raw.stats) ?? {};
  const enquiriesDelta = formatDashboardDelta(
    stats.total_enquiries_delta_percent as number | null | undefined,
  );
  const viewsDelta = formatDashboardDelta(
    stats.profile_views_delta_percent as number | null | undefined,
  );
  const conversionDelta = formatDashboardDelta(
    stats.conversion_delta_percent as number | null | undefined,
  );

  return [
    {
      title: "Total Enquiries",
      value: formatCount(asNumber(stats.total_enquiries)),
      delta: enquiriesDelta ?? "Stable",
      up: (asNumber(stats.total_enquiries_delta_percent) ?? 0) >= 0,
    },
    {
      title: "Profile Views",
      value: formatCount(asNumber(stats.profile_views)),
      delta: viewsDelta ?? "Stable",
      up: (asNumber(stats.profile_views_delta_percent) ?? 0) >= 0,
    },
    {
      title: "Avg Conversion",
      value: formatPercent(asNumber(stats.conversion_rate)),
      delta: conversionDelta ?? "Stable",
      up: (asNumber(stats.conversion_delta_percent) ?? 0) >= 0,
    },
    {
      title: "Response Time",
      value: pickString(stats, ["response_time_label"], "—"),
      delta: pickString(stats, ["response_time_delta_label"], "Stable"),
      up: pickBool(stats, ["response_time_improved"]),
    },
  ];
}

export async function fetchVendorAnalytics(
  range: VendorAnalyticsRange = "30d",
): Promise<VendorAnalyticsData> {
  const res = await request.get("/vendor/analytics", { params: { range } });
  const data = unwrapData(res);

  const traffic = asRecord(data.traffic_trend) ?? {};
  const channelPayload = asRecord(data.leads_by_channel) ?? {};
  const heatmap = asRecord(data.engagement_heatmap) ?? {};
  const preview = asRecord(data.preview) ?? {};
  const statsRaw = asRecord(data.stats) ?? {};

  const channels = Array.isArray(channelPayload.channels)
    ? channelPayload.channels
      .map((item) => {
        const row = asRecord(item);
        if (!row) return null;
        return {
          key: pickString(row, ["key"]),
          label: pickString(row, ["label"]),
          percent: asNumber(row.percent),
          color: pickString(row, ["color"], "slate-400"),
        };
      })
      .filter((item): item is VendorAnalyticsChannel => item !== null && item.label !== "")
    : [];

  const reachAreas = Array.isArray(data.reach_areas)
    ? data.reach_areas
      .map((item) => {
        const row = asRecord(item);
        if (!row) return null;
        return {
          area: pickString(row, ["area"], "Unknown"),
          value: asNumber(row.value),
        };
      })
      .filter((item): item is { area: string; value: number } => item !== null)
    : [];

  const grid = Array.isArray(heatmap.grid)
    ? heatmap.grid.map((row) =>
      Array.isArray(row) ? row.map((cell) => asNumber(cell)) : [],
    )
    : [];

  const topListings = Array.isArray(data.top_listings)
    ? data.top_listings
      .map((item) => {
        const row = asRecord(item);
        if (!row) return null;
        const name = pickString(row, ["name"], "");
        if (!name) return null;
        const views = asNumber(row.views);
        const clicks = asNumber(row.clicks);
        const ctr = asNumber(row.ctr);
        const enquiries = asNumber(row.enquiries);
        return {
          name,
          views: formatCount(views),
          clicks: formatCount(clicks),
          ctr: formatPercent(ctr),
          enquiries: formatCount(enquiries),
          status: pickString(row, ["status"], "Active"),
        };
      })
      .filter((item): item is VendorAnalyticsListing => item !== null)
    : [];

  const viewsHeights = Array.isArray(traffic.views_heights)
    ? traffic.views_heights.map((v) => asNumber(v))
    : [];
  const enquiriesHeights = Array.isArray(traffic.enquiries_heights)
    ? traffic.enquiries_heights.map((v) => asNumber(v))
    : [];

  const chartHeights = Array.isArray(preview.chart_heights)
    ? preview.chart_heights.map((v) => asNumber(v))
    : viewsHeights;

  return {
    range: (pickString(data, ["range"], "30d") as VendorAnalyticsRange) || "30d",
    rangeLabel: pickString(data, ["range_label"], "Last 30 Days"),
    stats: parseStats(data),
    trafficTrend: {
      viewsHeights,
      enquiriesHeights,
      highlightIndex: asNumber(traffic.highlight_index),
    },
    leadsByChannel: {
      dominantPercent: asNumber(channelPayload.dominant_percent),
      dominantLabel: pickString(channelPayload, ["dominant_label"], "Search Power"),
      channels,
      conicGradient: buildConicGradient(channels),
    },
    reachAreas,
    engagementHeatmap: {
      grid,
      peakInsight: pickString(heatmap, ["peak_insight"], ""),
    },
    topListings,
    preview: {
      totalViews: formatCount(
        asNumber(preview.total_views, asNumber(statsRaw.profile_views)),
      ),
      totalBookings: formatCount(
        asNumber(preview.total_bookings, asNumber(statsRaw.total_enquiries)),
      ),
      reviews: formatCount(asNumber(preview.reviews, asNumber(statsRaw.total_reviews))),
      conversion: formatPercent(
        asNumber(preview.conversion_rate, asNumber(statsRaw.conversion_rate)),
      ),
      chartHeights: chartHeights.length > 0 ? chartHeights : [30, 45, 40, 68, 54, 72, 50, 35, 63, 45],
    },
  };
}
