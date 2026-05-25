export const QUERY_KEYS = {
  conversations: ['conversations'] as const,
  conversation: (uuid: string) => ['conversations', uuid] as const,
  messages: (uuid: string) => ['messages', uuid] as const,
  notifications: (params?: { page?: number; perPage?: number; unreadOnly?: boolean }) =>
    ['notifications', params ?? {}] as const,
  notificationsUnread: ['notifications', 'unread-count'] as const,
} as const
