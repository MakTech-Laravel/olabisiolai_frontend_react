import { showInfo, showSuccess, showWarning } from '@/lib/sweetAlert'
import { useMessagingStore } from '@/store/messagingStore'
import type { RealtimeNotificationPayload, RealtimeNotificationTone } from '@/types/realtimeNotification'

function shouldShowDesktopToast(): boolean {
  return typeof document !== 'undefined' && document.visibilityState !== 'visible'
}

function isViewingConversation(conversationUuid: string | undefined): boolean {
  if (!conversationUuid) return false
  return useMessagingStore.getState().activeConversationUuid === conversationUuid
}

function toastForTone(tone: RealtimeNotificationTone | string | undefined) {
  if (tone === 'success') return showSuccess
  if (tone === 'warning' || tone === 'error') return showWarning
  return showInfo
}

export function notifyNewMessage(
  senderName: string,
  preview: string,
  conversationUuid?: string,
) {
  if (isViewingConversation(conversationUuid)) return
  void showInfo(`${senderName}: ${preview}`)
}

export function notifyRealtime(payload: RealtimeNotificationPayload) {
  if (!shouldShowDesktopToast()) return

  const title = String(payload.title ?? payload.sender_name ?? 'Notification')
  const body = String(payload.message ?? payload.preview ?? '')
  const text = body ? `${title}: ${body}` : title
  const show = toastForTone(payload.tone)

  void show(text)
}
