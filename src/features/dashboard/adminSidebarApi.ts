import { request } from "@/api/request";

export type AdminSidebarCounts = {
  pending_verifications: number;
  pending_boosts: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, value);
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }
  return 0;
}

export async function fetchAdminSidebarCounts(): Promise<AdminSidebarCounts> {
  const res = await request.get("/admin/sidebar-counts");
  const root = asRecord(res.data);
  if (!root || root.success !== true) {
    const message =
      (typeof root?.message === "string" && root.message) || "Unable to load sidebar counts.";
    throw new Error(message);
  }

  const data = asRecord(root.data) ?? {};

  return {
    pending_verifications: asNumber(data.pending_verifications),
    pending_boosts: asNumber(data.pending_boosts),
  };
}
