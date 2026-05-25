import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationsReadBulk,
  type FetchNotificationsParams,
} from '@/api/notifications'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { groupNotificationsForDisplay } from '@/features/notifications/groupNotifications'
import { toNotificationDisplay } from '@/features/notifications/notificationDisplay'

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: QUERY_KEYS.notificationsUnread,
    queryFn: fetchUnreadNotificationCount,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })
}

export function useNotifications(params: FetchNotificationsParams = {}) {
  const query = useQuery({
    queryKey: QUERY_KEYS.notifications(params),
    queryFn: () => fetchNotifications(params),
    staleTime: 15_000,
  })

  const items = (query.data?.items ?? []).map(toNotificationDisplay)
  const groupedItems = useMemo(() => groupNotificationsForDisplay(items), [items])

  return {
    ...query,
    items,
    groupedItems,
    unreadCount: query.data?.unread_count ?? 0,
    meta: query.data?.meta,
  }
}

export function useNotificationMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationsUnread })
  }

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: invalidate,
  })

  const markAllRead = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: invalidate,
  })

  const markBulkRead = useMutation({
    mutationFn: markNotificationsReadBulk,
    onSuccess: invalidate,
  })

  return { markRead, markBulkRead, markAllRead, invalidate }
}
