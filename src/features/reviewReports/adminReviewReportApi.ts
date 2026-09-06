import { request } from "@/api/request";
import type { ReviewReportDto, ReviewReportPagination } from "./types";

export type AdminReviewReportListParams = {
  status?: "pending" | "reviewed" | "dismissed";
  reason?: string;
  review_id?: number;
  per_page?: number;
  page?: number;
};

export type AdminReviewReportListResult = {
  data: ReviewReportDto[];
  pagination: ReviewReportPagination;
};

export async function adminListReviewReports(
  params: AdminReviewReportListParams = {},
): Promise<AdminReviewReportListResult> {
  const res = await request.get("/admin/review-reports", { params });
  const body = res.data as { data: ReviewReportDto[]; pagination: ReviewReportPagination };
  return { data: body.data ?? [], pagination: body.pagination };
}

export async function adminViewReviewReport(id: number): Promise<ReviewReportDto> {
  const res = await request.get(`/admin/review-reports/${id}`);
  return (res.data as { data: ReviewReportDto }).data;
}

export async function adminDismissReviewReport(id: number): Promise<ReviewReportDto> {
  const res = await request.post(`/admin/review-reports/${id}/dismiss`, {});
  return (res.data as { data: ReviewReportDto }).data;
}

export async function adminResolveReviewReport(id: number): Promise<ReviewReportDto> {
  const res = await request.post(`/admin/review-reports/${id}/resolve`, {});
  return (res.data as { data: ReviewReportDto }).data;
}
