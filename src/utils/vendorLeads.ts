import type { ChatMessage, Lead, LeadChannel } from '@/components/sections/vendor/leads/leadsData'
import { dayjs } from '@/lib/dayjs'
import type { Conversation } from '@/types/conversation'
import type { Message } from '@/types/message'
import { formatLastSeen } from '@/utils/formatters'
import { getConversationTitle } from '@/utils/messageUtils'

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatLeadStatus(conv: Conversation): Lead['status'] {
  return conv.unread_count > 0 ? 'new' : 'contacted'
}

function lastSeenLabel(conv: Conversation, selfUserId: number): string {
  const other = conv.participants.find((p) => p.user_id !== selfUserId)
  const presence = other?.user?.presence
  if (presence?.status === 'online') return 'now'
  const raw = presence?.last_seen_at
  if (raw) return formatLastSeen(raw)
  const lm = conv.last_message?.created_at
  return lm ? dayjs(lm).fromNow() : '—'
}

function formatDateTime(iso: string): string {
  return dayjs(iso).format('YYYY-MM-DD h:mm A')
}

export function conversationToLead(
  conv: Conversation,
  selfUserId: number,
  channel: LeadChannel,
): Lead {
  const title = getConversationTitle(conv, selfUserId)
  const other = conv.participants.find((p) => p.user_id !== selfUserId)
  const online = other?.user?.presence?.status === 'online'

  const preview =
    conv.last_message?.body?.trim() ||
    (conv.last_message?.attachments?.length ? 'Attachment' : 'No messages yet')

  const when = conv.last_message?.created_at ?? conv.updated_at

  return {
    id: conv.uuid,
    name: title,
    initials: initialsFromName(title),
    phone: '—',
    channel,
    dateTime: formatDateTime(when),
    status: formatLeadStatus(conv),
    message: preview,
    lastSeen: lastSeenLabel(conv, selfUserId),
    online,
    chatSubtitle: conv.name?.trim() || undefined,
  }
}

export function messageToChatMessage(m: Message, vendorUserId: number): ChatMessage {
  const sid = m.sender?.id ?? 0
  return {
    id: m.uuid,
    from: sid === vendorUserId ? 'vendor' : 'lead',
    text: m.body?.trim() || (m.attachments.length ? '' : ''),
    time: dayjs(m.created_at).format('h:mm A'),
    status: m.status,
    read_by: m.read_by,
    attachments: m.attachments,
  }
}
