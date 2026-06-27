import type { QueryClient } from '@tanstack/react-query';

import { request } from '@/api/request';
import { resolveMediaUrl } from '@/lib/mediaUrl';

export type PublicReviewImage = {
  id: number;
  url: string;
  original_filename?: string;
};

export type PublicReview = {
  id: number;
  reviewer_name: string;
  is_anonymous: boolean;
  rating: number;
  review_text: string;
  created_at: string;
  images: PublicReviewImage[];
};

export type ReviewRatingDistribution = {
  stars: number;
  count: number;
};

export type BusinessReviewsSummary = {
  total_reviews: number;
  average_rating: number;
  rating_distribution: ReviewRatingDistribution[];
};

export type BusinessReviewsResult = {
  data: PublicReview[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  summary?: BusinessReviewsSummary;
};

export type FetchBusinessReviewsOptions = {
  page?: number;
  perPage?: number;
  rating?: number;
  sort?: 'recent' | 'top';
};

function mapReviewImages(raw: unknown): PublicReviewImage[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry): PublicReviewImage | null => {
      const row = entry as Record<string, unknown>;
      const url = resolveMediaUrl(String(row.url ?? ''), '');
      if (!url) return null;

      const image: PublicReviewImage = {
        id: Number(row.id ?? 0),
        url,
      };
      if (row.original_filename) {
        image.original_filename = String(row.original_filename);
      }
      return image;
    })
    .filter((image): image is PublicReviewImage => image !== null);
}

function mapReviewRow(item: Record<string, unknown>): PublicReview {
  return {
    id: Number(item.id ?? 0),
    reviewer_name: item.is_anonymous
      ? 'Anonymous'
      : String(item.reviewer_name ?? item.display_name ?? item.full_name ?? 'Anonymous'),
    is_anonymous: Boolean(item.is_anonymous),
    rating: Number(item.rating ?? 5),
    review_text: String(item.review_text ?? ''),
    created_at: String(item.created_at ?? ''),
    images: mapReviewImages(item.images),
  };
}

/** Refetch business profile and review lists after a new review is submitted. */
export async function invalidateBusinessReviewQueries(
  queryClient: QueryClient,
  businessId: number,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['business', businessId] }),
    queryClient.invalidateQueries({ queryKey: ['reviews', businessId] }),
    queryClient.invalidateQueries({ queryKey: ['business-reviews', businessId] }),
  ]);
}

function mapSummary(raw: unknown): BusinessReviewsSummary | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const row = raw as Record<string, unknown>;
  const distribution = Array.isArray(row.rating_distribution)
    ? row.rating_distribution.map((entry) => {
        const item = entry as Record<string, unknown>;
        return {
          stars: Number(item.stars ?? 0),
          count: Number(item.count ?? 0),
        };
      })
    : [];

  return {
    total_reviews: Number(row.total_reviews ?? 0),
    average_rating: Number(row.average_rating ?? 0),
    rating_distribution: distribution,
  };
}

export async function fetchBusinessReviews(
  businessId: number,
  options: FetchBusinessReviewsOptions = {},
): Promise<BusinessReviewsResult> {
  const payload: Record<string, unknown> = {
    business_id: businessId,
    page: options.page ?? 1,
    per_page: options.perPage ?? 15,
  };
  if (options.rating) payload.rating = options.rating;
  if (options.sort) payload.sort = options.sort;

  try {
    const res = await request.post('/reviews', payload, { skipAuthRedirect: true });
    const body = res.data as {
      success?: boolean;
      data?: unknown;
      pagination?: Record<string, unknown>;
      summary?: unknown;
    };
    const list = Array.isArray(body.data) ? body.data : [];
    const p = body.pagination ?? {};

    return {
      data: (list as Record<string, unknown>[])
        .filter((item) => item.is_approved !== false)
        .map(mapReviewRow),
      pagination: {
        current_page: Number(p.current_page ?? 1),
        last_page: Number(p.last_page ?? 1),
        per_page: Number(p.per_page ?? 15),
        total: Number(p.total ?? 0),
      },
      summary: mapSummary(body.summary),
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

export async function submitReview(payload: SubmitReviewPayload) {
  const formData = new FormData();
  formData.append('business_id', String(payload.business_id));
  formData.append('full_name', payload.full_name.trim() || 'Anonymous');
  formData.append('is_anonymous', payload.is_anonymous ? '1' : '0');
  formData.append('rating', String(payload.rating));
  formData.append('review_text', payload.review_text.trim());
  (payload.images ?? []).forEach((file, index) => {
    formData.append(`images[${index}]`, file);
  });
  const res = await request.post('/reviews/store', formData, { skipAuthRedirect: true });
  return (res.data as { data: unknown }).data;
}
