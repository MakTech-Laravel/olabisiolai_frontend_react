import type { VendorBoostPendingRequest } from "@/features/boost/vendorBoostApi";

export type BoostPlanCampaignStatus = {
  status: "active" | "pending" | "expired";
  label: string;
  durationLeftLabel?: string | null;
  awaitingPayment?: boolean;
};

export type BoostCampaignRow = {
  id: number;
  tier_key: string;
  tier_label: string;
  tier_badge: string;
  duration_days: number;
  amount: number;
  currency: string;
  status: string;
  status_label: string;
  display_status: string;
  display_status_label: string;
  duration_left_label: string | null;
  views_count?: number;
  enquiries_count?: number;
  payment_id?: number | null;
  can_continue_payment?: boolean;
  can_extend?: boolean;
  can_boost_again?: boolean;
  renew_type?: string | null;
  source_campaign_id?: number | null;
  is_extension_record?: boolean;
  extension_parent_id?: number | null;
  extensions?: Array<{
    request_id?: number;
    duration_days?: number;
    amount?: number;
    currency?: string;
    approved_at?: string;
  }>;
  metadata?: Record<string, unknown> | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string | null;
  reviewed_at?: string | null;
  business: {
    id: number;
    business_name: string;
    vendor_name?: string | null;
    vendor_email?: string | null;
  } | null;
  location: {
    id: number;
    label: string;
    state: string;
    city: string;
    lga: string;
  } | null;
};

export function tierBadgeClasses(badge: string): string {
  switch (badge) {
    case "GOLD":
      return "bg-yellow-400 text-yellow-900";
    case "SILVER":
      return "bg-gray-400 text-white";
    case "BRONZE":
      return "bg-orange-200 text-orange-800";
    default:
      return "bg-slate-200 text-slate-800";
  }
}

export function resolveCampaignStatusForTier(
  tierKey: string,
  campaigns: BoostCampaignRow[],
  pendingRequest?: VendorBoostPendingRequest | null,
): BoostPlanCampaignStatus | null {
  const visibleCampaigns = campaigns.filter(
    (row) => row.display_status !== "extension_merged" && !row.is_extension_record,
  );
  const forTier = visibleCampaigns.filter((row) => row.tier_key === tierKey);
  const active = forTier.find((row) => row.display_status === "active");
  const unpaidExtend = forTier.find(
    (row) =>
      row.can_continue_payment &&
      row.display_status === "pending_payment" &&
      row.renew_type === "extend",
  );

  if (active) {
    return {
      status: "active",
      label: active.display_status_label,
      durationLeftLabel: active.duration_left_label,
      awaitingPayment: Boolean(unpaidExtend),
    };
  }

  if (pendingRequest?.tier_key === tierKey) {
    return {
      status: "pending",
      label: pendingRequest.can_continue_payment
        ? "Awaiting payment"
        : pendingRequest.status_label,
      awaitingPayment: Boolean(pendingRequest.can_continue_payment),
    };
  }

  const pending = forTier.find(
    (row) => row.display_status === "pending_admin" || row.display_status === "pending_payment",
  );
  if (pending) {
    return {
      status: "pending",
      label: pending.display_status_label,
    };
  }

  const expired = forTier.find((row) => row.display_status === "expired");
  if (expired) {
    return {
      status: "expired",
      label: expired.display_status_label,
      durationLeftLabel: expired.duration_left_label,
    };
  }

  return null;
}

export function formatCompactCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(value);
}

export function displayStatusClasses(status: string): string {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-700";
    case "expired":
      return "bg-pink-100 text-pink-600";
    case "pending_admin":
      return "bg-amber-100 text-amber-800";
    case "pending_payment":
      return "bg-sky-100 text-sky-800";
    case "rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}
