export type MessageReportStatus = 'pending' | 'reviewed' | 'dismissed';

export type MessageReportUser = {
  id: number;
  name: string;
  email: string | null;
  role: string;
  status: string;
};

export type MessageReportDto = {
  id: number;
  message_id: number;
  message_uuid: string;
  conversation_id: number;
  conversation_uuid?: string;
  reason: string;
  reason_label: string;
  description: string | null;
  status: MessageReportStatus;
  status_label: string;
  reviewed_at: string | null;
  admin_note?: string | null;
  last_admin_email_subject?: string | null;
  last_admin_email_sent_at?: string | null;
  message?: {
    uuid: string;
    body: string | null;
    type: string;
    created_at: string;
  };
  reporter?: MessageReportUser;
  reported_user?: MessageReportUser;
  created_at: string;
  created_at_human?: string;
};

export type MessageReportPagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type MessageReportReasonOption = {
  value: string;
  label: string;
};
