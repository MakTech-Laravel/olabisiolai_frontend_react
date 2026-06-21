import type { QueryClient } from '@tanstack/react-query'

import { QUERY_KEYS } from '@/constants/queryKeys'
import {
  bumpConversationToTopInCache,
  updateConversationInCache,
} from '@/features/messaging/conversationCache'
import { notifyNewMessage, notifyRealtime } from '@/services/notificationService'
import { showInfo } from '@/lib/sweetAlert'
import type { RealtimeNotificationPayload } from '@/types/realtimeNotification'

export type RealtimeNotificationHandlerContext = {
  queryClient: QueryClient
  navigate?: (path: string) => void
  isAdmin?: boolean
}

export function handleRealtimeNotification(
  payload: RealtimeNotificationPayload,
  ctx: RealtimeNotificationHandlerContext,
): void {
  const type = String(payload.type ?? '')

  if (type === 'new_message') {
    handleNewMessage(payload, ctx)
    void ctx.queryClient.invalidateQueries({ queryKey: ['notifications'] })
    void ctx.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationsUnread })
    return
  }

  if (type === 'new_follower') {
    const follower = String(payload.follower_name ?? payload.title ?? 'Someone')
    const business = String(payload.business_name ?? 'your business')
    void showInfo(`${follower} started following "${business}".`)
    void ctx.queryClient.invalidateQueries({ queryKey: ['notifications'] })
    void ctx.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationsUnread })
    return
  }

  notifyRealtime(payload)

  if (type === 'verification_approved' || type === 'verification_flagged' || type === 'payment_completed') {
    void ctx.queryClient.invalidateQueries({ queryKey: ['vendor', 'verification'] })
    void ctx.queryClient.invalidateQueries({ queryKey: ['business'] })
  }

  if (type === 'verification_submitted' && ctx.isAdmin) {
    void ctx.queryClient.invalidateQueries({ queryKey: ['admin', 'verification'] })
  }

  void ctx.queryClient.invalidateQueries({ queryKey: ['notifications'] })
  void ctx.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationsUnread })
}

function handleNewMessage(
  payload: RealtimeNotificationPayload,
  ctx: RealtimeNotificationHandlerContext,
): void {
  const conversationUuid = String(payload.conversation_uuid ?? '')
  const unreadCountRaw = payload.unread_count
  const unreadCount =
    typeof unreadCountRaw === 'number'
      ? unreadCountRaw
      : Number.isFinite(Number(unreadCountRaw))
        ? Number(unreadCountRaw)
        : null

  if (conversationUuid) {
    updateConversationInCache(ctx.queryClient, conversationUuid, (c) => ({
      ...c,
      unread_count: unreadCount ?? c.unread_count,
      updated_at: new Date().toISOString(),
    }))
    bumpConversationToTopInCache(ctx.queryClient, conversationUuid)
  } else {
    void ctx.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations })
  }

  if (payload.from_platform_admin === true) {
    void ctx.queryClient.invalidateQueries({ queryKey: ['vendor-admin-chat'] })
  }

  const sender = String(payload.sender_name ?? payload.title ?? 'Message')
  const preview = String(payload.preview ?? payload.message ?? '')
  notifyNewMessage(sender, preview, conversationUuid || undefined)
}
