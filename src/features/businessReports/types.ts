export type BusinessReportBusiness = {
  id: number;
  business_name: string;
};

export type BusinessReportReporter = {
  id: number;
  name: string;
  email: string;
};

export type BusinessReportDto = {
  id: number;
  business_info_id: number;
  reason: string;
  reason_label: string;
  description: string | null;
  status: 'pending' | 'reviewed' | 'dismissed';
  status_label: string;
  reviewed_at: string | null;
  business?: BusinessReportBusiness;
  reporter?: BusinessReportReporter;
  created_at: string;
  created_at_human?: string;
};

export type BusinessReportPagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};
