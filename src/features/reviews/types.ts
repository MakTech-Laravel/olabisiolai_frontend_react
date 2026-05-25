export type ReviewImage = {
  id: number;
  url: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
};

export type ReviewBusiness = {
  id: number;
  business_name: string;
};

export type ReviewReply = {
  id: number;
  reply_text: string;
  created_at: string;
  created_at_human?: string;
  updated_at?: string;
};

export type ReviewDto = {
  id: number;
  reviewer_name: string;
  is_anonymous: boolean;
  rating: number;
  review_text: string;
  is_approved: boolean;
  is_flagged?: boolean;
  flag_reason?: string | null;
  flagged_at?: string | null;
  flagged_at_human?: string | null;
  business: ReviewBusiness;
  images: ReviewImage[];
  replies: ReviewReply[];
  replies_count: number;
  created_at: string;
  created_at_human?: string;
  updated_at?: string;
};

export type ReviewPagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type ReviewStatistics = {
  total_reviews: number;
  approved_reviews: number;
  flagged_reviews: number;
  pending_business_reports?: number;
  average_rating: number;
  rating_distribution: {
    '5_star': number;
    '4_star': number;
    '3_star': number;
    '2_star': number;
    '1_star': number;
  };
};
