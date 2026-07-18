import { request } from "@/api/request";
import type { PaymentMethod, PaymentRow, PaymentStatus } from "@/components/Modal/PaymentDetailsModal.types";

type RawRecord = Record<string, unknown>;

export type AdminPaymentTransactionType = "subscription" | "boost" | "verification" | "wallet_top_up";

export type AdminPaymentGateway = "paystack" | "flutterwave";

export type AdminPaymentsListParams = {
  page?: number;
  per_page?: number;
  status?: "all" | PaymentStatus;
  purpose?: "all" | AdminPaymentTransactionType;
  search?: string;
};

export type AdminPaymentListItem = PaymentRow & {
  transactionType: AdminPaymentTransactionType;
};

export type AdminPaymentDetail = AdminPaymentListItem & {
  businessId: number | null;
  userId: number | null;
  txRef: string;
  gatewayTransactionId: string;
  isConsumed: boolean;
};

export type AdminPaymentsPagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type AdminPaymentsListResponse = {
  items: AdminPaymentListItem[];
  pagination: AdminPaymentsPagination;
};

export type AdminPaymentTrendPoint = {
  label: string;
  value: number;
};

export type AdminPaymentBreakdownItem = {
  label: string;
  width_percent: number;
};

export type AdminPaymentsAnalytics = {
  overview: {
    total_revenue: number;
    verification_revenue: number;
    subscription_revenue: number;
    boost_revenue: number;
    total_growth_percent: number | null;
    verification_growth_percent: number | null;
    subscription_growth_percent: number | null;
    boost_growth_percent: number | null;
  };
  trend: AdminPaymentTrendPoint[];
  breakdown: AdminPaymentBreakdownItem[];
};

function asRecord(value: unknown): RawRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as RawRecord) : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pickString(record: RawRecord, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return fallback;
}

function parseStatus(value: unknown): PaymentStatus {
  if (value === "completed" || value === "pending" || value === "failed") return value;
  return "pending";
}

function parseMethod(value: unknown): PaymentMethod {
  if (value === "card" || value === "bank_transfer" || value === "wallet" || value === "waived") return value;
  return "card";
}

function parseTransactionType(value: unknown): AdminPaymentTransactionType {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (raw === "subscription") return "subscription";
  if (raw === "boost" || raw === "boosting") return "boost";
  if (raw === "verification") return "verification";
  if (raw === "wallet_top_up" || raw === "wallet_topup") return "wallet_top_up";
  return "subscription";
}

function parseListItem(raw: unknown): AdminPaymentListItem | null {
  const item = asRecord(raw);
  if (!item) return null;
  const id = asNumber(item.id);
  if (id === null || id <= 0) return null;

  const transactionType = parseTransactionType(item.transaction_type ?? item.purpose);

  return {
    id,
    listKey: pickString(item, ["list_key", "listKey"], String(id)),
    business: pickString(item, ["business"], "—"),
    payerName: pickString(item, ["payer_name", "payerName"], "—"),
    payerEmail: pickString(item, ["payer_email", "payerEmail"], ""),
    reference: pickString(item, ["reference_display", "reference", "tx_ref"], "—"),
    amountNgn: asNumber(item.amount) ?? asNumber(item.amount_ngn) ?? 0,
    method: parseMethod(item.method),
    status: parseStatus(item.status),
    transactionType,
    dateShort: pickString(item, ["date_short", "dateShort"], ""),
    dateTimeLong: pickString(item, ["date_time_long", "dateTimeLong"], ""),
  };
}

function parsePagination(raw: unknown): AdminPaymentsPagination {
  const p = asRecord(raw) ?? {};
  return {
    current_page: Math.max(1, asNumber(p.current_page) ?? 1),
    last_page: Math.max(1, asNumber(p.last_page) ?? 1),
    per_page: Math.max(1, asNumber(p.per_page) ?? 10),
    total: Math.max(0, asNumber(p.total) ?? 0),
  };
}

function unwrapData(res: { data: unknown }): RawRecord {
  const root = asRecord(res.data);
  if (!root || root.success !== true) {
    const message =
      (typeof root?.message === "string" && root.message) || "Unable to load payments.";
    throw new Error(message);
  }
  return asRecord(root.data) ?? {};
}

export async function fetchAdminPayments(
  params: AdminPaymentsListParams = {},
): Promise<AdminPaymentsListResponse> {
  const query: Record<string, string | number> = {
    page: params.page ?? 1,
    per_page: params.per_page ?? 10,
  };

  if (params.status && params.status !== "all") query.status = params.status;
  if (params.purpose && params.purpose !== "all") query.purpose = params.purpose;
  if (params.search?.trim()) query.search = params.search.trim();

  const res = await request.get("/admin/payments", { params: query });
  const data = unwrapData(res);

  const items = (Array.isArray(data.items) ? data.items : [])
    .map(parseListItem)
    .filter((row): row is AdminPaymentListItem => row !== null);

  return {
    items,
    pagination: parsePagination(data.pagination),
  };
}

export async function fetchAdminPaymentsAnalytics(
  trendRange: "monthly" | "yearly" = "monthly",
): Promise<AdminPaymentsAnalytics> {
  const res = await request.get("/admin/payments/analytics", {
    params: { trend_range: trendRange },
  });
  const data = unwrapData(res);
  const overview = asRecord(data.overview) ?? {};
  const trend = (Array.isArray(data.trend) ? data.trend : [])
    .map((point) => {
      const row = asRecord(point);
      if (!row) return null;
      return {
        label: pickString(row, ["label"], ""),
        value: asNumber(row.value) ?? 0,
      };
    })
    .filter((point): point is AdminPaymentTrendPoint => point !== null && point.label !== "");

  const breakdown = (Array.isArray(data.breakdown) ? data.breakdown : [])
    .map((item) => {
      const row = asRecord(item);
      if (!row) return null;
      return {
        label: pickString(row, ["label"], ""),
        width_percent: Math.max(0, Math.min(100, asNumber(row.width_percent) ?? 0)),
      };
    })
    .filter((item): item is AdminPaymentBreakdownItem => item !== null && item.label !== "");

  return {
    overview: {
      total_revenue: asNumber(overview.total_revenue) ?? 0,
      verification_revenue: asNumber(overview.verification_revenue) ?? 0,
      subscription_revenue: asNumber(overview.subscription_revenue) ?? 0,
      boost_revenue: asNumber(overview.boost_revenue) ?? 0,
      total_growth_percent: asNumber(overview.total_growth_percent),
      verification_growth_percent: asNumber(overview.verification_growth_percent),
      subscription_growth_percent: asNumber(overview.subscription_growth_percent),
      boost_growth_percent: asNumber(overview.boost_growth_percent),
    },
    trend,
    breakdown,
  };
}

export async function fetchAdminPaymentDetail(paymentId: number): Promise<AdminPaymentDetail> {
  const res = await request.get(`/admin/payments/${paymentId}`);
  const data = unwrapData(res);
  const payment = parseListItem(data.payment);
  if (!payment) throw new Error("Payment not found.");
  const raw = asRecord(data.payment) ?? {};

  return {
    ...payment,
    businessId: asNumber(raw.business_id),
    userId: asNumber(raw.user_id),
    txRef: pickString(raw, ["tx_ref", "reference"], ""),
    gatewayTransactionId: pickString(raw, ["gateway_transaction_id", "gatewayTransactionId"], ""),
    isConsumed: raw.is_consumed === true,
  };
}

export async function applyAdminPayment(
  paymentId: number,
  body: {
    gateway: AdminPaymentGateway;
    gateway_transaction_id: string;
    reason?: string;
    verify_with_gateway?: boolean;
  },
): Promise<{ message: string }> {
  const res = await request.post(`/admin/payments/${paymentId}/apply`, body);
  const root = asRecord(res.data);
  if (!root || root.success !== true) {
    throw new Error((typeof root?.message === "string" && root.message) || "Could not apply payment.");
  }
  return { message: (typeof root.message === "string" && root.message) || "Payment applied." };
}

export async function reconcileAdminPayment(
  paymentId: number,
  body: { paystack_reference?: string },
): Promise<{ message: string }> {
  const res = await request.post(`/admin/payments/${paymentId}/reconcile`, body);
  const root = asRecord(res.data);
  if (!root || root.success !== true) {
    throw new Error((typeof root?.message === "string" && root.message) || "Reconciliation failed.");
  }
  return { message: (typeof root.message === "string" && root.message) || "Payment reconciled." };
}

export async function grantAdminPayment(
  paymentId: number,
  body: {
    reason: string;
    paystack_reference?: string;
  },
): Promise<{ message: string }> {
  const res = await request.post(`/admin/payments/${paymentId}/grant`, body);
  const root = asRecord(res.data);
  if (!root || root.success !== true) {
    throw new Error((typeof root?.message === "string" && root.message) || "Could not grant payment.");
  }
  return { message: (typeof root.message === "string" && root.message) || "Payment granted." };
}

export {
  grantAdminPremium,
  type GrantAdminPremiumBody,
  type GrantPremiumPaymentHandling,
  type GrantPremiumPaymentMethod,
} from "@/features/payments/adminPremiumApi";

export async function exportAdminPaymentsCsv(params: AdminPaymentsListParams = {}): Promise<Blob> {
  const query: Record<string, string> = {};
  if (params.status && params.status !== "all") query.status = params.status;
  if (params.purpose && params.purpose !== "all") query.purpose = params.purpose;
  if (params.search?.trim()) query.search = params.search.trim();

  const res = await request.get("/admin/payments/export", {
    params: query,
    responseType: "blob",
  });

  return res.data as Blob;
}
