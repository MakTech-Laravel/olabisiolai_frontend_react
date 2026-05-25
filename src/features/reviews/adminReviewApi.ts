import { request } from '@/api/request';
import type { ReviewDto, ReviewPagination, ReviewStatistics } from './types';

export type AdminListParams = {
  business_id?: number;
  is_approved?: boolean;
  is_flagged?: boolean;
  rating?: number;
  search?: string;
  per_page?: number;
  page?: number;
};

export type AdminListResult = {
  data: ReviewDto[];
  pagination: ReviewPagination;
};

export async function adminListReviews(params: AdminListParams = {}): Promise<AdminListResult> {
  const res = await request.post('/admin/reviews', params);
  const body = res.data as { data: ReviewDto[]; pagination: ReviewPagination };
  return { data: body.data ?? [], pagination: body.pagination };
}

export async function adminViewReview(id: number): Promise<ReviewDto> {
  const res = await request.post(`/admin/reviews/${id}/view`, {});
  return (res.data as { data: ReviewDto }).data;
}

export type ApprovePayload = { is_approved: true };
export type FlagPayload = { is_approved: false; flag_reason?: string };
export type UpdatePayload = ApprovePayload | FlagPayload;

export async function adminUpdateReview(id: number, payload: UpdatePayload): Promise<ReviewDto> {
  const res = await request.post(`/admin/reviews/${id}/update`, payload);
  return (res.data as { data: ReviewDto }).data;
}

export async function adminDeleteReview(id: number): Promise<void> {
  await request.post(`/admin/reviews/${id}/delete`, {});
}

export async function adminBulkApprove(reviewIds: number[]): Promise<void> {
  await request.post('/admin/reviews/bulk-approve', { review_ids: reviewIds });
}

export async function adminBulkFlag(reviewIds: number[], flagReason: string): Promise<void> {
  await request.post('/admin/reviews/bulk-flag', { review_ids: reviewIds, flag_reason: flagReason });
}

export async function adminGetStatistics(): Promise<ReviewStatistics> {
  const res = await request.post('/admin/reviews/statistics', {});
  return (res.data as { data: ReviewStatistics }).data;
}
