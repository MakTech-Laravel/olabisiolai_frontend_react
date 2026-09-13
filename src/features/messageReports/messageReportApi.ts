import { isAxiosError } from 'axios';

import { request } from '@/api/request';
import { getLaravelErrorMessage } from '@/lib/laravelApiError';
import type {
  MessageReportDto,
  MessageReportPagination,
  MessageReportReasonOption,
  MessageReportStatus,
} from './types';

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

function parseReasons(payload: unknown): MessageReportReasonOption[] {
  if (!payload || typeof payload !== 'object') return [];
  const root = payload as ApiEnvelope<{ reasons?: unknown[] }> & { reasons?: unknown[] };
  const list = Array.isArray(root.data?.reasons)
    ? root.data.reasons
    : Array.isArray(root.reasons)
      ? root.reasons
      : [];

  return list
    .map((item) => {
      const row = item as Record<string, unknown>;
      const value = String(row.value ?? '').trim();
      const label = String(row.label ?? '').trim();
      if (!value || !label) return null;
      return { value, label };
    })
    .filter((item): item is MessageReportReasonOption => item !== null);
}

export async function fetchMessageReportReasons(): Promise<MessageReportReasonOption[]> {
  const res = await request.get('/message-report-reasons', { skipAuthRedirect: true });
  const parsed = parseReasons(res.data);
  if (parsed.length === 0) throw new Error('Report reasons are unavailable.');
  return parsed;
}

export async function submitMessageReport(
  messageUuid: string,
  payload: { reason: string; description?: string },
): Promise<string> {
  try {
    const res = await request.post<ApiEnvelope<unknown>>(
      `/messages/${messageUuid}/report`,
      payload,
    );
    if (res.data?.success === false) {
      throw new Error(res.data.message ?? 'Could not submit report.');
    }
    return res.data?.message ?? 'Thank you for your report.';
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(getLaravelErrorMessage(error, 'Could not submit report. Please try again.'));
    }
    throw error;
  }
}

export type AdminMessageReportListParams = {
  status?: MessageReportStatus;
  reason?: string;
  reported_user_id?: number;
  search?: string;
  per_page?: number;
  page?: number;
};

export async function adminListMessageReports(
  params: AdminMessageReportListParams = {},
): Promise<{ data: MessageReportDto[]; pagination: MessageReportPagination }> {
  const res = await request.get('/admin/message-reports', { params });
  const body = res.data as { data?: MessageReportDto[]; pagination?: MessageReportPagination };
  return {
    data: body.data ?? [],
    pagination: body.pagination ?? { current_page: 1, last_page: 1, per_page: 15, total: 0 },
  };
}

export async function adminViewMessageReport(id: number): Promise<MessageReportDto> {
  const res = await request.get(`/admin/message-reports/${id}`);
  return (res.data as { data: MessageReportDto }).data;
}

function unwrapReport(res: unknown): MessageReportDto {
  const body = res as { data?: MessageReportDto | { report?: MessageReportDto } };
  const data = body.data;
  if (data && 'report' in data && data.report) return data.report;
  return data as MessageReportDto;
}

export async function adminDismissMessageReport(id: number, admin_note?: string) {
  const res = await request.post(`/admin/message-reports/${id}/dismiss`, { admin_note });
  return unwrapReport(res.data);
}

export async function adminResolveMessageReport(id: number, admin_note?: string) {
  const res = await request.post(`/admin/message-reports/${id}/resolve`, { admin_note });
  return unwrapReport(res.data);
}

export async function adminEmailReportedUser(
  id: number,
  payload: { subject: string; body: string },
) {
  const res = await request.post(`/admin/message-reports/${id}/email-reported-user`, payload);
  return unwrapReport(res.data);
}

export async function adminSuspendReportedUser(id: number, admin_note?: string) {
  const res = await request.post(`/admin/message-reports/${id}/suspend-reported-user`, {
    admin_note,
  });
  return unwrapReport(res.data);
}
