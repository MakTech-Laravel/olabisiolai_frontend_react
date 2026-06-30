import type { StoredNotification } from '@/api/notifications'
import type { RealtimeNotificationTone, RealtimeNotificationType } from '@/types/realtimeNotification'

export type NotificationDisplay = {
  id: string
  type: RealtimeNotificationType | string
  title: string
  message: string
  tone: RealtimeNotificationTone | string
  href: string
  isRead: boolean
  createdAt: string | null
  raw: StoredNotification
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** One headline for sender; subtitle is preview only (no repeated name). */
function newMessageActivityCopy(d: Record<string, unknown>): { title: string; message: string } {
  const sender = String(d.sender_name ?? '').trim()
  const explicitTitle = String(d.title ?? '').trim()
  const rawPreview = String(d.preview ?? d.message ?? '').trim()

  const resolvedSender =
    sender ||
    (explicitTitle && !/^new message\b/i.test(explicitTitle) ? explicitTitle : '') ||
    'Someone'

  const titleOut =
    explicitTitle && /^new message\b/i.test(explicitTitle)
      ? explicitTitle
      : `New message from ${resolvedSender}`

  let preview = rawPreview
  if (resolvedSender && preview) {
    preview = preview
      .replace(new RegExp(`^${escapeRegExp(resolvedSender)}\\s*[:\\-–]\\s*`, 'i'), '')
      .trim()
  }

  if (!preview && rawPreview) {
    preview = rawPreview
  }

  if (preview.toLowerCase() === resolvedSender.toLowerCase()) {
    preview = ''
  }

  const messageOut = preview.length > 0 ? preview : 'Tap to open the conversation.'

  return { title: titleOut, message: messageOut }
}

const VENDOR_ROUTES: Record<string, string> = {
  new_message: '/vendor/leads',
  verification_approved: '/vendor/verification',
  verification_flagged: '/vendor/verification',
  verification_revoked: '/vendor/verification',
  verification_submitted: '/vendor/verification',
  payment_completed: '/vendor/payments',
  system_announcement: '/vendor/notifications',
}

const USER_ROUTES: Record<string, string> = {
  new_message: '/user/messages',
  verification_approved: '/user/settings/account',
  verification_flagged: '/user/settings/account',
  payment_completed: '/user/dashboard',
  system_announcement: '/user/activity',
}

export function resolveNotificationHref(
  type: string,
  actionUrl?: string | null,
): string {
  if (actionUrl && actionUrl.startsWith('/')) {
    return actionUrl
  }
  return VENDOR_ROUTES[type] ?? '/vendor/notifications'
}

/** Routes for end-user (customer) notification taps. */
export function resolveUserNotificationHref(
  type: string,
  actionUrl?: string | null,
  conversationUuid?: string | null,
): string {
  if (actionUrl && actionUrl.startsWith('/')) {
    return actionUrl
  }
  if (type === 'new_message' && conversationUuid) {
    return `/user/messages?scope=personal&c=${encodeURIComponent(conversationUuid)}`
  }
  return USER_ROUTES[type] ?? '/user/activity'
}

export function toNotificationDisplay(item: StoredNotification): NotificationDisplay {
  const d = item.data ?? {}
  const type = String(d.type ?? 'info')
  const conversationUuid =
    typeof d.conversation_uuid === 'string' ? d.conversation_uuid : null

  let href = resolveNotificationHref(type, d.action_url)
  if (type === 'new_message') {
    if (d.from_platform_admin === true && typeof d.action_url === 'string' && d.action_url.startsWith('/')) {
      href = d.action_url
    } else if (conversationUuid) {
      href = `/user/messages?scope=personal&c=${encodeURIComponent(conversationUuid)}`
    }
  }

  return {
    id: item.id,
    type,
    title: String(d.title ?? d.sender_name ?? 'Notification'),
    message: String(d.message ?? d.preview ?? ''),
    tone: (d.tone as RealtimeNotificationTone) ?? 'info',
    href,
    isRead: item.read_at != null,
    createdAt: item.created_at,
    raw: item,
  }
}

export function toUserNotificationDisplay(item: StoredNotification): NotificationDisplay {
  const d = item.data ?? {}
  const type = String(d.type ?? 'info')
  const conversationUuid =
    typeof d.conversation_uuid === 'string' ? d.conversation_uuid : null

  const href = resolveUserNotificationHref(type, d.action_url, conversationUuid)

  if (type === 'new_message') {
    const { title, message } = newMessageActivityCopy(d as Record<string, unknown>)
    return {
      id: item.id,
      type,
      title,
      message,
      tone: (d.tone as RealtimeNotificationTone) ?? 'info',
      href,
      isRead: item.read_at != null,
      createdAt: item.created_at,
      raw: item,
    }
  }

  return {
    id: item.id,
    type,
    title: String(d.title ?? d.sender_name ?? 'Notification'),
    message: String(d.message ?? d.preview ?? ''),
    tone: (d.tone as RealtimeNotificationTone) ?? 'info',
    href,
    isRead: item.read_at != null,
    createdAt: item.created_at,
    raw: item,
  }
}

export function formatNotificationTime(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`

  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`

  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function toneDotClass(tone: string): string {
  if (tone === 'success') return 'bg-emerald-500'
  if (tone === 'warning') return 'bg-amber-500'
  if (tone === 'error') return 'bg-red-500'
  return 'bg-[#003F87]'
}
