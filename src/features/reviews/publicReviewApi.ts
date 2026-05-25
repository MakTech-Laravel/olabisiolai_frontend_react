import { request } from '@/api/request';
import type { ReviewDto, ReviewPagination } from './types';

export type PublicReview = {
  id: number;
  reviewer_name: string;
  is_anonymous: boolean;
  rating: number;
  review_text: string;
  created_at: string;
};

export type BusinessReviewsResult = {
  data: PublicReview[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export async function fetchBusinessReviews(
  businessId: number,
  page = 1,
): Promise<BusinessReviewsResult> {
  try {
    const res = await request.post(
      '/reviews',
      { business_id: businessId, page },
      { skipAuthRedirect: true },
    );
    const body = res.data as {
      success?: boolean;
      data?: unknown;
      pagination?: Record<string, unknown>;
    };
    const list = Array.isArray(body.data) ? body.data : [];
    const p = body.pagination ?? {};
    return {
      data: (list as Record<string, unknown>[])
        .filter((item) => item.is_approved !== false)
        .map((item) => ({
          id: Number(item.id ?? 0),
          reviewer_name: item.is_anonymous
            ? 'Anonymous'
            : String(item.reviewer_name ?? item.display_name ?? item.full_name ?? 'Anonymous'),
          is_anonymous: Boolean(item.is_anonymous),
          rating: Number(item.rating ?? 5),
          review_text: String(item.review_text ?? ''),
          created_at: String(item.created_at ?? ''),
        })),
      pagination: {
        current_page: Number(p.current_page ?? 1),
        last_page: Number(p.last_page ?? 1),
        per_page: Number(p.per_page ?? 15),
        total: Number(p.total ?? 0),
      },
    };
  } catch {
    return {
      data: [],
      pagination: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
    };
  }
}

export type SubmitReviewPayload = {
  business_id: number;
  full_name: string;
  is_anonymous: boolean;
  rating: number;
  review_text: string;
  images?: File[];
};

export type FetchReviewsParams = {
  business_id: number;
  rating?: number;
  per_page?: number;
  page?: number;
};

export type FetchReviewsResult = {
  data: ReviewDto[];
  pagination: ReviewPagination;
};

export async function fetchPublicReviews(params: FetchReviewsParams): Promise<FetchReviewsResult> {
  const res = await request.get('/reviews', { params, skipAuthRedirect: true });
  const body = res.data as { data: ReviewDto[]; pagination: ReviewPagination };
  return {
    data: body.data ?? [],
    pagination: body.pagination,
  };
}

export async function submitReview(payload: SubmitReviewPayload): Promise<ReviewDto> {
  const formData = new FormData();
  formData.append('business_id', String(payload.business_id));
  // Send actual name — API uses is_anonymous flag to decide display
  formData.append('full_name', payload.full_name.trim() || 'Anonymous');
  formData.append('is_anonymous', payload.is_anonymous ? '1' : '0');
  formData.append('rating', String(payload.rating));
  formData.append('review_text', payload.review_text.trim());
  (payload.images ?? []).forEach((file) => {
    formData.append('images[]', file);
  });
  const res = await request.post('/reviews/store', formData, { skipAuthRedirect: true });
  return (res.data as { data: ReviewDto }).data;
}
