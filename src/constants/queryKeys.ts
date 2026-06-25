export const QUERY_KEYS = {
  businessReportReasons: ['business-report-reasons'] as const,
  conversations: (scope = 'all') => ['conversations', scope] as const,
  conversation: (uuid: string) => ['conversations', uuid] as const,
  messages: (uuid: string) => ['messages', uuid] as const,
  notifications: (params?: { page?: number; perPage?: number; unreadOnly?: boolean }) =>
    ['notifications', params ?? {}] as const,
  notificationsUnread: ['notifications', 'unread-count'] as const,
} as const
