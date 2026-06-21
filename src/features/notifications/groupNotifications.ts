import type { NotificationDisplay } from '@/features/notifications/notificationDisplay'

export type GroupedNotificationDisplay = NotificationDisplay & {
  groupKey: string
  /** Unread notifications in this group (red badge). */
  unreadCount: number
  /** Total messages/notifications bundled in this row. */
  messageCount: number
  notificationIds: string[]
  conversationUuid: string | null
  senderId: number | null
  isGrouped: boolean
}

function messageGroupKey(item: NotificationDisplay): string {
  const d = item.raw.data ?? {}
  const senderId = d.sender_id
  if (typeof senderId === 'number' && senderId > 0) {
    return `new_message:user:${senderId}`
  }
  const name = String(d.sender_name ?? item.title ?? 'unknown')
  return `new_message:name:${name}`
}

function isNewer(a: string | null, b: string | null): boolean {
  if (!a) return false
  if (!b) return true
  return new Date(a).getTime() > new Date(b).getTime()
}

function buildMessageHref(conversationUuid: string | null, fallbackHref: string): string {
  const base = fallbackHref.split('?')[0] || '/vendor/leads'
  if (conversationUuid) {
    return `${base}?c=${encodeURIComponent(conversationUuid)}`
  }
  return base
}

function followerGroupKey(item: NotificationDisplay): string {
  const d = item.raw.data ?? {}
  const followerId = d.follower_id
  if (typeof followerId === 'number' && followerId > 0) {
    return `new_follower:user:${followerId}`
  }
  const name = String(d.follower_name ?? item.title ?? 'unknown')
  return `new_follower:name:${name}`
}

/**
 * Collapse multiple `new_message` alerts from the same sender into one row with a count badge.
 */
export function groupNotificationsForDisplay(
  items: NotificationDisplay[],
): GroupedNotificationDisplay[] {
  const messageGroups = new Map<string, GroupedNotificationDisplay>()
  const followerGroups = new Map<string, GroupedNotificationDisplay>()
  const other: GroupedNotificationDisplay[] = []

  for (const item of items) {
    if (item.type === 'new_follower') {
      const key = followerGroupKey(item)
      const d = item.raw.data ?? {}
      const followerId =
        typeof d.follower_id === 'number' ? d.follower_id : Number(d.follower_id) || null

      const existing = followerGroups.get(key)
      if (existing === undefined) {
        followerGroups.set(key, {
          ...item,
          groupKey: key,
          unreadCount: item.isRead ? 0 : 1,
          messageCount: 1,
          notificationIds: [item.id],
          conversationUuid: null,
          senderId: followerId,
          isGrouped: true,
        })
        continue
      }

      existing.messageCount += 1
      if (!item.isRead) {
        existing.unreadCount += 1
        existing.isRead = false
      }
      existing.notificationIds.push(item.id)

      if (isNewer(item.createdAt, existing.createdAt)) {
        existing.id = item.id
        existing.message = item.message
        existing.createdAt = item.createdAt
        existing.raw = item.raw
      }
      continue
    }

    if (item.type !== 'new_message') {
      other.push({
        ...item,
        groupKey: item.id,
        unreadCount: item.isRead ? 0 : 1,
        messageCount: 1,
        notificationIds: [item.id],
        conversationUuid: null,
        senderId: null,
        isGrouped: false,
      })
      continue
    }

    const key = messageGroupKey(item)
    const d = item.raw.data ?? {}
    const conversationUuid =
      typeof d.conversation_uuid === 'string' ? d.conversation_uuid : null
    const senderId =
      typeof d.sender_id === 'number' ? d.sender_id : Number(d.sender_id) || null

    const existing = messageGroups.get(key)
    if (existing === undefined) {
      messageGroups.set(key, {
        ...item,
        groupKey: key,
        href: buildMessageHref(conversationUuid, item.href),
        unreadCount: item.isRead ? 0 : 1,
        messageCount: 1,
        notificationIds: [item.id],
        conversationUuid,
        senderId,
        isGrouped: true,
      })
      continue
    }

    existing.messageCount += 1
    if (!item.isRead) {
      existing.unreadCount += 1
      existing.isRead = false
    }
    existing.notificationIds.push(item.id)

    if (isNewer(item.createdAt, existing.createdAt)) {
      existing.id = item.id
      existing.message = item.message
      existing.createdAt = item.createdAt
      existing.raw = item.raw
      if (conversationUuid) {
        existing.conversationUuid = conversationUuid
        existing.href = buildMessageHref(conversationUuid, item.href)
      }
    }
  }

  const grouped = [...messageGroups.values(), ...followerGroups.values(), ...other]

  grouped.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return tb - ta
  })

  return grouped
}
