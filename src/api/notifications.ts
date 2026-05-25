import { api } from '@/api/client'
import { unwrapLaravelData } from '@/api/laravelResponse'
import type { RealtimeNotificationPayload } from '@/types/realtimeNotification'

export type StoredNotification = {
  id: string
  type: string
  data: RealtimeNotificationPayload
  read_at: string | null
  created_at: string | null
}

export type NotificationsListResponse = {
  unread_count: number
  items: StoredNotification[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export type FetchNotificationsParams = {
  page?: number
  perPage?: number
  unreadOnly?: boolean
}

export async function fetchNotifications(
  params: FetchNotificationsParams = {},
): Promise<NotificationsListResponse> {
  const res = await api.get('/notifications', {
    params: {
      page: params.page ?? 1,
      per_page: params.perPage ?? 20,
      unread_only: params.unreadOnly ? 1 : 0,
    },
  })
  const data = unwrapLaravelData<NotificationsListResponse>(res.data)
  return (
    data ?? {
      unread_count: 0,
      items: [],
      meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 },
    }
  )
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const res = await api.get('/notifications/unread-count')
  const data = unwrapLaravelData<{ count: number }>(res.data)
  return typeof data?.count === 'number' ? data.count : 0
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.post(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post('/notifications/read-all')
}

export async function markNotificationsReadBulk(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  await api.post('/notifications/read-bulk', { ids })
}
