import { request } from "@/api/request";

export type BusinessReportReasonOption = {
  value: string;
  label: string;
};

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

function parseReasons(payload: unknown): BusinessReportReasonOption[] {
  if (!payload || typeof payload !== "object") return [];

  const root = payload as ApiEnvelope<{ reasons?: unknown[] }> & {
    reasons?: unknown[];
  };
  const inner = root.data;
  const list = Array.isArray(inner?.reasons)
    ? inner.reasons
    : Array.isArray(root.reasons)
      ? root.reasons
      : [];

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

export async function fetchBusinessReportReasons(): Promise<BusinessReportReasonOption[]> {
  const res = await request.get("/business-report-reasons", {
    skipAuthRedirect: true,
  });
  const parsed = parseReasons(res.data);
  if (parsed.length === 0) {
    throw new Error("Report reasons are unavailable.");
  }
  return parsed;
}

export async function submitBusinessReport(
  businessId: number,
  payload: { reason: string; description?: string },
): Promise<string> {
  const res = await request.post<ApiEnvelope<unknown>>(
    `/user/businesses/${businessId}/report`,
    payload,
  );
  const body = res.data;
  if (body?.success === false) {
    throw new Error(body.message ?? "Could not submit report.");
  }
  return body?.message ?? "Thank you for your report.";
}
