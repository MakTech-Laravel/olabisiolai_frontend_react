import { request } from "@/api/request";

type RawRecord = Record<string, unknown>;

function asRecord(value: unknown): RawRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as RawRecord)
    : null;
}

export type GrantPremiumPaymentHandling = "waived" | "recorded";
export type GrantPremiumPaymentMethod = "bank_transfer" | "cash" | "other";

export type GrantAdminPremiumBody = {
  business_id: number;
  reason: string;
  duration_days?: number;
  paystack_reference?: string;
  payment_handling?: GrantPremiumPaymentHandling;
  payment_method?: GrantPremiumPaymentMethod;
  payment_reference?: string;
  amount?: number;
  package_id?: string;
};

export async function grantAdminPremium(body: GrantAdminPremiumBody): Promise<{ message: string }> {
  const res = await request.post("/admin/subscriptions/grant-premium", body);
  const root = asRecord(res.data);
  if (!root || root.success !== true) {
    throw new Error((typeof root?.message === "string" && root.message) || "Could not grant premium.");
  }
  return { message: (typeof root.message === "string" && root.message) || "Premium granted." };
}

export type PremiumExpirationUrgency = "all" | "active" | "expiring_soon" | "expired";

export type PremiumExpirationItem = {
  subscription_id: number;
  business_id: number;
  business_name: string;
  business_status: string | null;
  category: string;
  vendor_name: string;
  vendor_email: string;
  vendor_phone: string;
  plan: string;
  status: string;
  status_label: string;
  is_trial: boolean;
  expires_at: string | null;
  expires_at_label: string | null;
  days_remaining: number | null;
  urgency: "active" | "expiring_soon" | "expired";
  needs_follow_up: boolean;
};

export type PremiumExpirationSummary = {
  total_premium: number;
  active: number;
  expiring_soon: number;
  expired: number;
};

export type PremiumExpirationTrackerResponse = {
  summary: PremiumExpirationSummary;
  items: PremiumExpirationItem[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type PremiumExpirationTrackerParams = {
  page?: number;
  per_page?: number;
  search?: string;
  urgency?: PremiumExpirationUrgency;
  days_ahead?: number;
};

function parseItem(raw: unknown): PremiumExpirationItem | null {
  const item = asRecord(raw);
  if (!item) return null;
  const businessId = Number(item.business_id);
  const subscriptionId = Number(item.subscription_id);
  if (!Number.isFinite(businessId) || !Number.isFinite(subscriptionId)) return null;

  const urgencyRaw = String(item.urgency ?? "active");
  const urgency =
    urgencyRaw === "expired" || urgencyRaw === "expiring_soon" ? urgencyRaw : "active";

  return {
    subscription_id: subscriptionId,
    business_id: businessId,
    business_name: String(item.business_name ?? "—"),
    business_status: item.business_status != null ? String(item.business_status) : null,
    category: String(item.category ?? "—"),
    vendor_name: String(item.vendor_name ?? "—"),
    vendor_email: String(item.vendor_email ?? ""),
    vendor_phone: String(item.vendor_phone ?? ""),
    plan: String(item.plan ?? "premium"),
    status: String(item.status ?? ""),
    status_label: String(item.status_label ?? item.status ?? ""),
    is_trial: Boolean(item.is_trial),
    expires_at: item.expires_at != null ? String(item.expires_at) : null,
    expires_at_label: item.expires_at_label != null ? String(item.expires_at_label) : null,
    days_remaining:
      item.days_remaining === null || item.days_remaining === undefined
        ? null
        : Number(item.days_remaining),
    urgency,
    needs_follow_up: Boolean(item.needs_follow_up),
  };
}

export async function fetchPremiumExpirationTracker(
  params: PremiumExpirationTrackerParams = {},
): Promise<PremiumExpirationTrackerResponse> {
  const res = await request.post("/admin/subscriptions/expiration-tracker", {
    page: params.page ?? 1,
    per_page: params.per_page ?? 15,
    search: params.search?.trim() || undefined,
    urgency: params.urgency ?? "all",
    days_ahead: params.days_ahead ?? 14,
  });
  const root = asRecord(res.data);
  if (!root || root.success !== true) {
    throw new Error(
      (typeof root?.message === "string" && root.message) || "Could not load expiration tracker.",
    );
  }

  const data = asRecord(root.data) ?? {};
  const summaryRaw = asRecord(data.summary) ?? {};
  const paginationRaw = asRecord(data.pagination) ?? {};
  const itemsRaw = Array.isArray(data.items) ? data.items : [];

  return {
    summary: {
      total_premium: Number(summaryRaw.total_premium ?? 0),
      active: Number(summaryRaw.active ?? 0),
      expiring_soon: Number(summaryRaw.expiring_soon ?? 0),
      expired: Number(summaryRaw.expired ?? 0),
    },
    items: itemsRaw.map(parseItem).filter((item): item is PremiumExpirationItem => item !== null),
    pagination: {
      current_page: Number(paginationRaw.current_page ?? 1),
      last_page: Number(paginationRaw.last_page ?? 1),
      per_page: Number(paginationRaw.per_page ?? 15),
      total: Number(paginationRaw.total ?? 0),
    },
  };
}
