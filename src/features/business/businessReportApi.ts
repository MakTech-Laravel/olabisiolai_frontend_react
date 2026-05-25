import { request } from "@/api/request";

export type BusinessReportReasonOption = {
  value: string;
  label: string;
};

function parseReasons(payload: unknown): BusinessReportReasonOption[] {
  if (!payload || typeof payload !== "object") return [];

  const root = payload as Record<string, unknown>;
  const inner = root.data;

  let list: unknown[] = [];
  if (Array.isArray(inner)) {
    list = inner;
  } else if (inner && typeof inner === "object") {
    const dataObj = inner as Record<string, unknown>;
    if (Array.isArray(dataObj.reasons)) {
      list = dataObj.reasons;
    }
  }
  if (list.length === 0 && Array.isArray(root.reasons)) {
    list = root.reasons;
  }

  return list
    .map((item) => {
      const row = item as Record<string, unknown>;
      const value = String(row.value ?? "").trim();
      const label = String(row.label ?? "").trim();
      if (!value || !label) return null;
      return { value, label };
    })
    .filter((item): item is BusinessReportReasonOption => item !== null);
}

const FALLBACK_REASONS: BusinessReportReasonOption[] = [
  { value: "illegal_or_fraudulent", label: "This is illegal/fraudulent" },
  { value: "spam", label: "This ad is spam" },
  { value: "wrong_price", label: "The price is wrong" },
  { value: "wrong_category", label: "Wrong category" },
  { value: "seller_asked_for_prepayment", label: "Seller asked for prepayment" },
  { value: "already_sold", label: "It is sold" },
];

export async function fetchBusinessReportReasons(): Promise<BusinessReportReasonOption[]> {
  const endpoints = ["/business-report-reasons", "/review-report-reasons"];

  for (const path of endpoints) {
    try {
      const res = await request.get(path, { skipAuthRedirect: true });
      const parsed = parseReasons(res.data);
      if (parsed.length > 0) return parsed;
    } catch {
      // try next endpoint
    }
  }

  return FALLBACK_REASONS;
}

export async function submitBusinessReport(
  businessId: number,
  payload: { reason: string; description?: string },
): Promise<string> {
  const res = await request.post(`/user/businesses/${businessId}/report`, payload);
  const body = res.data as { success?: boolean; message?: string };
  if (body.success === false) {
    throw new Error(body.message ?? "Could not submit report.");
  }
  return body.message ?? "Thank you for your report.";
}
