import { request } from "@/api/request";

type RawRecord = Record<string, unknown>;

export type VendorDashboardCompletionItem = {
  key: string;
  label: string;
  done: boolean;
};

export type VendorDashboardInteraction = {
  key: string;
  label: string;
  count: number;
};

export type VendorDashboardActivity = {
  title: string;
  subtitle: string;
  dot: "brand-red" | "primary";
};

export type VendorDashboardChecklistItem = {
  label: string;
  done: boolean;
};

export type VendorDashboardWeeklyEngagement = {
  labels: string[];
  views: number[];
  interactions: number[];
  viewsHeights: number[];
  interactionsHeights: number[];
};

export type VendorDashboardData = {
  hasBusiness: boolean;
  business: {
    id: number;
    name: string;
    logoUrl: string | null;
    coverPhotoUrls: string[];
    hasPhone: boolean;
    hasWhatsapp: boolean;
    hasWebsite: boolean;
  };
  subscription: {
    isPremiumActive: boolean;
    planLabel: string;
  };
  verification: {
    status: string;
    statusLabel: string;
    badgeTone: "emerald" | "amber" | "red" | "muted";
    description: string;
    isVerified: boolean;
  };
  boost: {
    status: "active" | "inactive" | "pending";
    statusLabel: string;
  };
  stats: {
    profileViews: number;
    profileViewsDeltaPercent: number | null;
    enquiries: number;
    enquiriesDeltaPercent: number | null;
    enquiriesProgressPercent: number;
    averageRating: number;
    totalReviews: number;
    conversionRate: number;
    visibilityDeltaPercent: number | null;
    trustScore: number;
    profileStrength: string;
    vendorTier: string;
  };
  interactions: VendorDashboardInteraction[];
  weeklyEngagement: VendorDashboardWeeklyEngagement;
  profileCompletion: {
    percent: number;
    items: VendorDashboardCompletionItem[];
    nextStepKey: string | null;
    nextStepLabel: string | null;
  };
  checklist: VendorDashboardChecklistItem[];
  recentActivity: VendorDashboardActivity[];
  support: {
    avgResponseLabel: string;
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

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = asNumber(value, NaN);
  return Number.isFinite(n) ? n : null;
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
      (typeof root?.message === "string" && root.message) || "Unable to load dashboard.";
    throw new Error(message);
  }
  return asRecord(root.data) ?? {};
}

function parseStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function parseCompletionItems(raw: unknown): VendorDashboardCompletionItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      const label = pickString(row, ["label"], "");
      if (!label) return null;
      return {
        key: pickString(row, ["key"], label),
        label,
        done: pickBool(row, ["done"]),
      };
    })
    .filter((item): item is VendorDashboardCompletionItem => item !== null);
}

function parseInteractions(raw: unknown): VendorDashboardInteraction[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      return {
        key: pickString(row, ["key"], ""),
        label: pickString(row, ["label"], ""),
        count: asNumber(row.count),
      };
    })
    .filter((item): item is VendorDashboardInteraction => item !== null && item.label !== "");
}

function parseActivity(raw: unknown): VendorDashboardActivity[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      const title = pickString(row, ["title"], "");
      if (!title) return null;
      const dot = pickString(row, ["dot"], "primary");
      return {
        title,
        subtitle: pickString(row, ["subtitle"], "Recently"),
        dot: dot === "brand-red" ? "brand-red" : "primary",
      };
    })
    .filter((item): item is VendorDashboardActivity => item !== null);
}

function parseChecklist(raw: unknown): VendorDashboardChecklistItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      const label = pickString(row, ["label"], "");
      if (!label) return null;
      return { label, done: pickBool(row, ["done"]) };
    })
    .filter((item): item is VendorDashboardChecklistItem => item !== null);
}

function parseWeeklyEngagement(raw: unknown): VendorDashboardWeeklyEngagement {
  const row = asRecord(raw) ?? {};
  const labels = parseStringList(row.labels);
  const views = Array.isArray(row.views) ? row.views.map((v) => asNumber(v)) : [];
  const interactions = Array.isArray(row.interactions)
    ? row.interactions.map((v) => asNumber(v))
    : [];
  const viewsHeights = Array.isArray(row.views_heights)
    ? row.views_heights.map((v) => asNumber(v))
    : [];
  const interactionsHeights = Array.isArray(row.interactions_heights)
    ? row.interactions_heights.map((v) => asNumber(v))
    : [];

  return {
    labels,
    views,
    interactions,
    viewsHeights,
    interactionsHeights,
  };
}

export function formatDashboardCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return value.toLocaleString();
}

export function formatDashboardDelta(delta: number | null | undefined): string | null {
  if (delta == null || !Number.isFinite(delta)) return null;
  const rounded = Math.round(delta * 10) / 10;
  if (rounded > 0) return `+${rounded}%`;
  if (rounded < 0) return `${rounded}%`;
  return "0%";
}

export function visibilitySubtitle(delta: number | null | undefined, premium: boolean): string {
  const formatted = formatDashboardDelta(delta);
  if (formatted) {
    return premium
      ? `Your business visibility is ${formatted} this week. Keep it going!`
      : `Your business visibility is ${formatted} this week. Keep your profile updated to attract high-intent leads.`;
  }
  return premium
    ? "Track your visibility, enquiries, and portfolio performance from one place."
    : "Keep your profile updated to attract high-intent leads.";
}

export async function fetchVendorDashboard(): Promise<VendorDashboardData> {
  const res = await request.get("/vendor/dashboard");
  const data = unwrapData(res);

  const business = asRecord(data.business) ?? {};
  const subscription = asRecord(data.subscription) ?? {};
  const verification = asRecord(data.verification) ?? {};
  const boost = asRecord(data.boost) ?? {};
  const stats = asRecord(data.stats) ?? {};
  const profileCompletion = asRecord(data.profile_completion) ?? {};
  const support = asRecord(data.support) ?? {};

  const boostStatus = pickString(boost, ["status"], "inactive");
  const badgeTone = pickString(verification, ["badge_tone"], "muted");

  return {
    hasBusiness: Boolean(data.has_business),
    business: {
      id: asNumber(business.id),
      name: pickString(business, ["name", "business_name"], "Your business"),
      logoUrl: pickString(business, ["logo_url"], "") || null,
      coverPhotoUrls: parseStringList(business.cover_photo_urls),
      hasPhone: pickBool(business, ["has_phone"]),
      hasWhatsapp: pickBool(business, ["has_whatsapp"]),
      hasWebsite: pickBool(business, ["has_website"]),
    },
    subscription: {
      isPremiumActive: pickBool(subscription, ["is_premium_active"]),
      planLabel: pickString(subscription, ["plan_label"], "Free"),
    },
    verification: {
      status: pickString(verification, ["status"], "none"),
      statusLabel: pickString(verification, ["status_label"], "Not verified"),
      badgeTone:
        badgeTone === "emerald" || badgeTone === "amber" || badgeTone === "red"
          ? badgeTone
          : "muted",
      description: pickString(verification, ["description"], ""),
      isVerified: pickBool(verification, ["is_verified"]),
    },
    boost: {
      status:
        boostStatus === "active" || boostStatus === "pending" ? boostStatus : "inactive",
      statusLabel: pickString(boost, ["status_label"], "Inactive"),
    },
    stats: {
      profileViews: asNumber(stats.profile_views),
      profileViewsDeltaPercent: asNullableNumber(stats.profile_views_delta_percent),
      enquiries: asNumber(stats.enquiries),
      enquiriesDeltaPercent: asNullableNumber(stats.enquiries_delta_percent),
      enquiriesProgressPercent: asNumber(stats.enquiries_progress_percent),
      averageRating: asNumber(stats.average_rating),
      totalReviews: asNumber(stats.total_reviews),
      conversionRate: asNumber(stats.conversion_rate),
      visibilityDeltaPercent: asNullableNumber(stats.visibility_delta_percent),
      trustScore: asNumber(stats.trust_score),
      profileStrength: pickString(stats, ["profile_strength"], "Low"),
      vendorTier: pickString(stats, ["vendor_tier"], "Free"),
    },
    interactions: parseInteractions(data.interactions),
    weeklyEngagement: parseWeeklyEngagement(data.weekly_engagement),
    profileCompletion: {
      percent: asNumber(profileCompletion.percent),
      items: parseCompletionItems(profileCompletion.items),
      nextStepKey: pickString(profileCompletion, ["next_step_key"], "") || null,
      nextStepLabel: pickString(profileCompletion, ["next_step_label"], "") || null,
    },
    checklist: parseChecklist(data.checklist),
    recentActivity: parseActivity(data.recent_activity),
    support: {
      avgResponseLabel: pickString(support, ["avg_response_label"], "Avg response: 2 hours"),
    },
  };
}
