import { request } from "@/api/request";

import type { BoostCampaignRow } from "@/features/boost/boostCampaignTypes";



type ApiEnvelope<T> = {

  success: boolean;

  message: string;

  data: T;

};



export type AdminBoostRequestRow = {

  id: number;

  tier_key: string;

  tier_label: string;

  tier_badge?: string;

  duration_days: number;

  amount: number;

  currency: string;

  status: string;

  status_label: string;

  display_status?: string;

  display_status_label?: string;

  is_flagged?: boolean;

  waiting_rank?: number;

  admin_note?: string | null;

  created_at: string | null;

  starts_on_assign?: boolean;

  projected_ends_at?: string | null;

  business: {

    id: number;

    business_name: string;

    vendor_name?: string | null;

    vendor_email?: string | null;

    category_name?: string | null;

  } | null;

  location: { id: number; label: string; lga: string; state?: string; city?: string } | null;

  views_count?: number;

  enquiries_count?: number;

  duration_left_label?: string | null;

};



export type AdminBoostRequestDetail = AdminBoostRequestRow & {

  is_flagged: boolean;

  starts_at: string | null;

  ends_at: string | null;

  metadata: Record<string, unknown> | null;

  business_detail: {

    id: number;

    business_name: string;

    business_description: string | null;

    services_offered: string[] | null;

    phone: string | null;

    whatsapp: string | null;

    website: string | null;

    verification_status: string | null;

    business_status: string | null;

    category: { id: number; name: string } | null;

  } | null;

  vendor: { id: number; name: string; email: string; phone: string | null } | null;

  payment: {

    id: number;

    tx_ref: string | null;

    amount: number;

    status: string;

    paid_at: string | null;

  } | null;

  reviewer: { id: number; name: string } | null;

};



export async function fetchAdminBoostWaitingList(): Promise<AdminBoostRequestRow[]> {

  const res = await request.post<ApiEnvelope<{ requests: AdminBoostRequestRow[] }>>(

    "/admin/boost-requests/waiting-list",

    {},

  );



  return res.data.data.requests ?? [];

}



export async function fetchAdminBoostRequestDetail(id: number): Promise<AdminBoostRequestDetail> {

  const res = await request.post<ApiEnvelope<{ request: AdminBoostRequestDetail }>>(

    "/admin/boost-requests/show",

    { id },

  );



  return res.data.data.request;

}



export async function fetchAdminBoostRequests(status = "pending_admin"): Promise<AdminBoostRequestRow[]> {

  const res = await request.post<ApiEnvelope<{ requests: AdminBoostRequestRow[] }>>(

    "/admin/boost-requests",

    { status },

  );



  return res.data.data.requests ?? [];

}



export async function approveAdminBoostRequest(
  id: number,
  note?: string,
): Promise<{ message: string }> {
  const res = await request.post<ApiEnvelope<{ request: AdminBoostRequestRow }>>(
    "/admin/boost-requests/approve",
    { id, note },
  );

  return { message: res.data.message };
}



export async function rejectAdminBoostRequest(id: number, note?: string): Promise<void> {

  await request.post("/admin/boost-requests/reject", { id, note });

}



export async function flagAdminBoostRequest(

  id: number,

  isFlagged: boolean,

  note?: string,

): Promise<void> {

  await request.post("/admin/boost-requests/flag", { id, is_flagged: isFlagged, note });

}



export async function fetchAdminBoostCampaigns(

  displayStatus?: string,

): Promise<BoostCampaignRow[]> {

  const res = await request.post<ApiEnvelope<{ campaigns: BoostCampaignRow[] }>>(

    "/admin/boost-requests/campaigns",

    displayStatus ? { display_status: displayStatus } : {},

  );



  return res.data.data.campaigns ?? [];

}

