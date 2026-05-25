import { useMemo } from 'react'

import { useConversations } from '@/hooks/useConversations'

export function useUnreadCount() {
  const { data } = useConversations()
  return useMemo(
    () => (data ?? []).reduce((n, c) => n + (c.unread_count ?? 0), 0),
    [data],
  )
}
