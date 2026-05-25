import { request } from '@/api/request';
import type { BusinessReportDto, BusinessReportPagination } from './types';

export type AdminBusinessReportListParams = {
  status?: 'pending' | 'reviewed' | 'dismissed';
  reason?: string;
  business_info_id?: number;
  search?: string;
  per_page?: number;
  page?: number;
};

export type AdminBusinessReportListResult = {
  data: BusinessReportDto[];
  pagination: BusinessReportPagination;
};

export async function adminListBusinessReports(
  params: AdminBusinessReportListParams = {},
): Promise<AdminBusinessReportListResult> {
  const res = await request.get('/admin/business-reports', { params });
  const body = res.data as { data: BusinessReportDto[]; pagination: BusinessReportPagination };
  return { data: body.data ?? [], pagination: body.pagination };
}

export async function adminViewBusinessReport(id: number): Promise<BusinessReportDto> {
  const res = await request.get(`/admin/business-reports/${id}`);
  return (res.data as { data: BusinessReportDto }).data;
}

export async function adminDismissBusinessReport(id: number): Promise<BusinessReportDto> {
  const res = await request.post(`/admin/business-reports/${id}/dismiss`, {});
  return (res.data as { data: BusinessReportDto }).data;
}

export async function adminResolveBusinessReport(id: number): Promise<BusinessReportDto> {
  const res = await request.post(`/admin/business-reports/${id}/resolve`, {});
  return (res.data as { data: BusinessReportDto }).data;
}

export async function adminBusinessReportStatistics(): Promise<{ pending: number; total: number }> {
  const res = await request.get('/admin/business-reports/statistics');
  return (res.data as { data: { pending: number; total: number } }).data;
}
