export type ReviewReportReview = {
  id: number;
  reviewer_name: string;
  rating: number;
  review_text: string;
  is_approved: boolean;
  business?: {
    id: number;
    business_name: string;
  };
};

export type ReviewReportReporter = {
  id: number;
  name: string;
  email: string;
};

export type ReviewReportDto = {
  id: number;
  reason: string;
  reason_label: string;
  description: string | null;
  status: "pending" | "reviewed" | "dismissed";
  status_label: string;
  reviewed_at: string | null;
  review?: ReviewReportReview;
  reporter?: ReviewReportReporter;
  created_at: string;
  created_at_human?: string;
};

export type ReviewReportPagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};
