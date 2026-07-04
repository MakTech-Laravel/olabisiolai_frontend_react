import { request } from '@/api/request';

export type AdminVerificationDocument = {
  id: number;
  parent_document_id?: number | null;
  document_type: string;
  title: string;
  description?: string | null;
  file_name: string;
  file_url?: string | null;
  mime_type?: string;
  file_size?: number;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  uploaded_by?: { id: number; name: string } | null;
  submitted_at: string;
};

export type AdminVerificationNote = {
  id: number;
  note_type: string;
  note: string;
  is_visible_to_vendor: boolean;
  created_at: string;
  added_by?: { id: number; name: string } | null;
};

export type AdminVerificationDetail = {
  id: number;
  business_name: string;
  verification_status: 'none' | 'pending' | 'approved';
  verification_status_label: string;
  needs_admin_reapproval?: boolean;
  has_open_document_review?: boolean;
  needs_document_action?: boolean;
  has_unused_verification_payment?: boolean;
  can_approve_all?: boolean;
  approve_all_block_reason?: string | null;
  is_flagged: boolean;
  is_approved: boolean;
  verification_note?: string | null;
  verified_at?: string | null;
  vendor?: { id: number; name: string; email: string; phone?: string };
  category?: { id: number; name: string };
  documents?: AdminVerificationDocument[];
  notes?: AdminVerificationNote[];
  payments?: Array<{
    id: number;
    package_id: string;
    amount: number;
    currency: string;
    status: string;
    is_consumed: boolean;
    paid_at: string | null;
  }>;
  created_at: string;
};

export type AdminVerificationRow = {
  id: number;
  business_name: string;
  verification_status: 'none' | 'pending' | 'approved';
  verification_status_label: string;
  can_approve_all?: boolean;
  approve_all_block_reason?: string | null;
  is_flagged: boolean;
  is_approved: boolean;
  vendor?: { id: number; name: string; email: string; phone?: string };
  category?: { id: number; name: string };
  verified_at?: string | null;
  submitted_at?: string;
  created_at: string;
};

export type AdminVerificationListResponse = {
  items: AdminVerificationRow[];
  count: number;
  pagination: {
    current_page: number;
    per_page: number;
    last_page: number;
    total: number;
  };
};

type ApiEnvelope<T> = { success: boolean; message: string; data: T };

function assertAdminSuccess<T>(payload: ApiEnvelope<T>): T {
  if (!payload.success) {
    throw new Error(payload.message || 'Request failed.');
  }
  return payload.data;
}

export async function adminListVerifications(params: {
  verification_status?: string;
  search?: string;
  per_page?: number;
  page?: number;
} = {}): Promise<AdminVerificationListResponse> {
  const res = await request.post<
    ApiEnvelope<{
      verifications: AdminVerificationRow[];
      count: number;
      pagination: AdminVerificationListResponse['pagination'];
    }>
  >('/admin/verifications', params);

  return {
    items: res.data.data.verifications ?? [],
    count: res.data.data.count ?? 0,
    pagination: res.data.data.pagination,
  };
}

export async function adminViewVerification(businessInfoId: number): Promise<AdminVerificationDetail> {
  const res = await request.post<ApiEnvelope<{ verification: AdminVerificationDetail }>>(
    '/admin/verifications/view',
    { business_info_id: businessInfoId },
  );
  return res.data.data.verification;
}

export async function adminGrantReverification(
  businessInfoId: number,
  reason: string,
): Promise<AdminVerificationDetail> {
  const res = await request.post<ApiEnvelope<{ verification: AdminVerificationDetail }>>(
    '/admin/verifications/grant-reverification',
    { business_info_id: businessInfoId, reason },
  );
  const data = assertAdminSuccess(res.data);
  return data.verification;
}

export async function adminReapproveVerification(
  businessInfoId: number,
  note?: string,
): Promise<AdminVerificationDetail> {
  const res = await request.post<ApiEnvelope<{ verification: AdminVerificationDetail }>>(
    '/admin/verifications/reapprove',
    { business_info_id: businessInfoId, note },
  );
  const data = assertAdminSuccess(res.data);
  return data.verification;
}

export async function adminApproveVerification(
  businessInfoId: number,
  note?: string,
): Promise<AdminVerificationDetail> {
  const res = await request.post<ApiEnvelope<{ verification: AdminVerificationDetail }>>(
    '/admin/verifications/approve',
    { business_info_id: businessInfoId, note },
  );
  return res.data.data.verification;
}

export async function adminFlagVerification(
  businessInfoId: number,
  reason: string,
): Promise<AdminVerificationDetail> {
  const res = await request.post<ApiEnvelope<{ verification: AdminVerificationDetail }>>(
    '/admin/verifications/flag',
    { business_info_id: businessInfoId, reason },
  );
  return res.data.data.verification;
}

export async function adminDeleteVerification(
  businessInfoId: number,
  reason?: string,
): Promise<AdminVerificationDetail> {
  const res = await request.post<ApiEnvelope<{ verification: AdminVerificationDetail }>>(
    '/admin/verifications/delete',
    { business_info_id: businessInfoId, reason },
  );
  return res.data.data.verification;
}

export async function adminReviewDocument(
  documentId: number,
  action: 'approve' | 'reject',
  reason?: string,
): Promise<void> {
  await request.post('/admin/verifications/documents/review', {
    document_id: documentId,
    action,
    reason,
  });
}

export async function adminAddVerificationNote(
  businessInfoId: number,
  note: string,
  isVisibleToVendor: boolean,
): Promise<void> {
  await request.post('/admin/verifications/note', {
    business_info_id: businessInfoId,
    note,
    note_type: isVisibleToVendor ? 'vendor_communication' : 'internal',
    is_visible_to_vendor: isVisibleToVendor,
  });
}
