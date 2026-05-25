import { request } from "@/api/request";

type RawRecord = Record<string, unknown>;

export type AdminDashboardRange = "weekly" | "monthly";

export type AdminDashboardStats = {
  total_businesses: number;
  verified_businesses: number;
  pending_verifications: number;
  daily_active_users: number;
  total_lead_clicks: number;
};

export type AdminDashboardSeriesPoint = {
  label: string;
  value: number;
};

export type AdminDashboardQuickAction = {
  title: string;
  description: string;
  action: string;
  href: string;
};

export type AdminDashboardData = {
  range: AdminDashboardRange;
  stats: AdminDashboardStats;
  leads_over_time: AdminDashboardSeriesPoint[];
  new_businesses: AdminDashboardSeriesPoint[];
  quick_actions: AdminDashboardQuickAction[];
};

function asRecord(value: unknown): RawRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as RawRecord) : null;
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function pickString(record: RawRecord, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return fallback;
}

function unwrapData(res: { data: unknown }): RawRecord {
  const root = asRecord(res.data);
  if (!root || root.success !== true) {
    const message =
      (typeof root?.message === "string" && root.message) || "Unable to load dashboard.";
    throw new Error(message);
  }
  return asRecord(root.data) ?? {};
}

function parseSeries(raw: unknown): AdminDashboardSeriesPoint[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((point) => {
      const row = asRecord(point);
      if (!row) return null;
      return {
        label: pickString(row, ["label"], ""),
        value: asNumber(row.value),
      };
    })
    .filter((point): point is AdminDashboardSeriesPoint => point !== null && point.label !== "");
}

function parseQuickActions(raw: unknown): AdminDashboardQuickAction[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      const title = pickString(row, ["title"], "");
      if (!title) return null;
      return {
        title,
        description: pickString(row, ["description"], ""),
        action: pickString(row, ["action"], "Open"),
        href: pickString(row, ["href"], "/admin/dashboard"),
      };
    })
    .filter((item): item is AdminDashboardQuickAction => item !== null);
}

export async function fetchAdminDashboard(
  range: AdminDashboardRange = "monthly",
): Promise<AdminDashboardData> {
  const res = await request.get("/admin/dashboard", { params: { range } });
  const data = unwrapData(res);
  const statsRow = asRecord(data.stats) ?? {};

  const rangeValue = data.range === "weekly" ? "weekly" : "monthly";

  return {
    range: rangeValue,
    stats: {
      total_businesses: asNumber(statsRow.total_businesses),
      verified_businesses: asNumber(statsRow.verified_businesses),
      pending_verifications: asNumber(statsRow.pending_verifications),
      daily_active_users: asNumber(statsRow.daily_active_users),
      total_lead_clicks: asNumber(statsRow.total_lead_clicks),
    },
    leads_over_time: parseSeries(data.leads_over_time),
    new_businesses: parseSeries(data.new_businesses),
    quick_actions: parseQuickActions(data.quick_actions),
  };
}
