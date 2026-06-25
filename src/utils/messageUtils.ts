import type { Conversation, ParticipantPresence } from '@/types/conversation'
import type { Attachment } from '@/types/attachment'
import type { Message, MessageType } from '@/types/message'
import type { MessagingUser } from '@/types/user'
import type { ApiResponse } from '@/types/api'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { formatReadAt } from '@/utils/formatters'

type ApiSender = {
  id: number
  name: string
  avatar_url?: string | null
}

export function mapApiSender(sender: ApiSender | null | undefined): MessagingUser {
  if (!sender) {
    return {
      id: 0,
      name: 'Unknown',
      avatar: null,
      status: 'offline',
      last_seen_at: null,
    }
  }
  const avatarRaw = sender.avatar_url?.trim()
  return {
    id: sender.id,
    name: sender.name,
    avatar: avatarRaw ? resolveMediaUrl(avatarRaw, '') || null : null,
    status: 'offline',
    last_seen_at: null,
  }
}

export function getMessagePreviewText(message: {
  body: string | null
  type?: MessageType
  attachments?: Attachment[]
}): string {
  if (message.body?.trim()) return message.body.trim()
  const attachments = message.attachments ?? []
  if (attachments.length > 0) {
    const first = attachments[0]
    if (first.type === 'image') return 'Photo'
    if (first.type === 'video') return 'Video'
    if (first.type === 'audio') return 'Audio'
    return first.file_name || 'Attachment'
  }
  if (message.type === 'attachment') return 'Attachment'
  return 'Message'
}

export function getConversationPreviewText(conversation: Conversation): string {
  if (conversation.last_message) {
    return getMessagePreviewText(conversation.last_message)
  }
  const preview = conversation.last_message_preview?.trim()
  if (preview) return preview
  if (conversation.unread_count > 0) return 'New message'
  return 'No messages yet'
}

export function getConversationPreviewTime(conversation: Conversation): string {
  return (
    conversation.last_message?.created_at ??
    conversation.last_message_at ??
    conversation.updated_at
  )
}

/** Parent snippet from API (no nested parent). */
export function normalizeMessageParent(
  raw: Record<string, unknown>,
): Message | null {
  if (!raw?.uuid) return null
  const sender = mapApiSender(raw.sender as ApiSender | undefined)
  const attachmentsRaw = raw.attachments
  const attachments: Attachment[] = Array.isArray(attachmentsRaw)
    ? attachmentsRaw.map((a) => normalizeAttachment(a as Record<string, unknown>))
    : []

  return {
    uuid: String(raw.uuid),
    conversation_id: Number(raw.conversation_id ?? 0),
    sender,
    parent: null,
    parent_uuid: null,
    body: (raw.body as string | null | undefined) ?? null,
    type: (raw.type as MessageType) ?? 'text',
    status: 'sent',
    attachments,
    reads: [],
    edited_at: null,
    created_at: String(raw.created_at ?? new Date().toISOString()),
  }
}

export function normalizeAttachment(raw: Record<string, unknown>): Attachment {
  const type = (raw.type as Attachment['type']) ?? 'document'
  const url = resolveAttachmentUrl(String(raw.url ?? ''))
  const thumbRaw = raw.thumbnail_url as string | null | undefined
  const thumbnail_url =
    thumbRaw && (thumbRaw.startsWith('http://') || thumbRaw.startsWith('https://'))
      ? thumbRaw
      : thumbRaw
        ? resolveAttachmentUrl(thumbRaw)
        : null

  return {
    id: raw.id != null ? Number(raw.id) : undefined,
    uuid: String(raw.uuid ?? ''),
    file_name: String(raw.file_name ?? 'Attachment'),
    mime_type: String(raw.mime_type ?? 'application/octet-stream'),
    type,
    url,
    thumbnail_url,
    thumbnail_path: (raw.thumbnail_path as string | null | undefined) ?? null,
    file_size: raw.file_size as number | undefined,
  }
}

/** Turn API attachment URLs into browser-loadable absolute URLs. */
export function resolveAttachmentUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed

  const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') ?? ''
  const origin = apiBase.replace(/\/api\/v\d+$/, '')
  return `${origin}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`
}

export function normalizeMessage(raw: Record<string, unknown>): Message {
  const sender = mapApiSender(raw.sender as ApiSender | undefined)
  const attachmentsRaw = raw.attachments
  const attachments: Attachment[] = Array.isArray(attachmentsRaw)
    ? attachmentsRaw.map((a) => normalizeAttachment(a as Record<string, unknown>))
    : []

  const readBy = raw.read_by as number[] | undefined
  const readsRaw = raw.reads
  const reads: Message['reads'] = Array.isArray(readsRaw)
    ? readsRaw.map((entry) => {
      const row = entry as Record<string, unknown>
      const user_id = Number(row.user_id ?? 0)
      const userRaw = row.user as Record<string, unknown> | undefined
      const readAtRaw = String(row.read_at ?? '')
      return {
        user_id,
        user: {
          id: user_id,
          name: String(userRaw?.name ?? ''),
          avatar: (userRaw?.avatar as string | null | undefined) ?? null,
        },
        read_at: readAtRaw ? formatReadAt(readAtRaw) : '',
      }
    })
    : (readBy?.map((user_id) => ({
      user_id,
      user: { id: user_id, name: '', avatar: null },
      read_at: '',
    })) ?? [])

  return {
    uuid: String(raw.uuid ?? ''),
    conversation_id: Number(raw.conversation_id ?? 0),
    sender,
    parent: raw.parent
      ? normalizeMessageParent(raw.parent as Record<string, unknown>)
      : null,
    parent_uuid:
      (raw.parent_uuid as string | null | undefined) ??
      (raw.parent && typeof raw.parent === 'object' && 'uuid' in raw.parent
        ? String((raw.parent as Record<string, unknown>).uuid)
        : null),
    body: (raw.body as string | null | undefined) ?? null,
    type: (raw.type as MessageType) ?? 'text',
    status: (raw.status as Message['status']) ?? 'sent',
    attachments,
    reads,
    read_by: readBy,
    edited_at: (raw.edited_at as string | null | undefined) ?? null,
    created_at: String(raw.created_at ?? new Date().toISOString()),
    updated_at: raw.updated_at as string | undefined,
  }
}

export function normalizeConversation(raw: Record<string, unknown>): Conversation {
  const parts = raw.participants
  const lastRaw = raw.last_message

  let last_message: Message | null = null
  if (lastRaw && typeof lastRaw === 'object' && lastRaw !== null && 'uuid' in lastRaw) {
    last_message = normalizeMessage(lastRaw as Record<string, unknown>)
  }

  const displayName =
    (raw.display_name as string | undefined) ??
    (raw.conversation_name as string | undefined)

  const peerRaw = raw.peer as Record<string, unknown> | null | undefined
  let peer: Conversation['peer'] = null
  if (peerRaw && typeof peerRaw === 'object') {
    const businessIdRaw = peerRaw.business_info_id
    const businessInfoId =
      typeof businessIdRaw === 'number' && businessIdRaw > 0
        ? businessIdRaw
        : businessIdRaw != null && String(businessIdRaw).trim() !== ''
          ? Number(businessIdRaw) || null
          : null

    peer = {
      user_id: Number(peerRaw.user_id ?? 0),
      id: Number(peerRaw.id ?? peerRaw.user_id ?? 0),
      uuid: peerRaw.uuid != null ? String(peerRaw.uuid) : undefined,
      role: peerRaw.role != null ? String(peerRaw.role) : undefined,
      name: String(peerRaw.name ?? peerRaw.display_name ?? ''),
      display_name:
        peerRaw.display_name != null ? String(peerRaw.display_name) : undefined,
      business_info_id: businessInfoId,
      avatar_url: (peerRaw.avatar_url as string | null | undefined) ?? null,
      is_verified: peerRaw.is_verified === true,
      presence: (peerRaw.presence as ParticipantPresence | null | undefined) ?? null,
    }
  }

  return {
    id: Number(raw.id ?? 0),
    uuid: String(raw.uuid ?? ''),
    type: raw.type as Conversation['type'],
    name: (raw.name as string | null | undefined) ?? null,
    display_name: displayName,
    conversation_name: displayName,
    conversation_image_url: (raw.conversation_image_url as string | null | undefined) ?? null,
    peer,
    participants: Array.isArray(parts)
      ? (parts as Conversation['participants'])
      : [],
    last_message,
    last_message_preview: (raw.last_message_preview as string | null | undefined) ?? null,
    last_message_at: (raw.last_message_at as string | null | undefined) ?? null,
    unread_count: Number(raw.unread_count ?? 0),
    is_archived: Boolean(raw.is_archived),
    tenant_id: raw.tenant_id as number | null | undefined,
    business_info_id:
      typeof raw.business_info_id === 'number' && raw.business_info_id > 0
        ? raw.business_info_id
        : raw.business_info_id != null && String(raw.business_info_id).trim() !== ''
          ? Number(raw.business_info_id) || null
          : peer?.business_info_id ?? null,
    created_at: String(raw.created_at ?? ''),
    updated_at: String(raw.updated_at ?? ''),
  }
}

export function conversationPeerAvatar(
  conv: Conversation,
  selfUserId: number,
): string | null {
  if (conv.conversation_image_url) return conv.conversation_image_url
  if (conv.peer?.avatar_url) return conv.peer.avatar_url
  const other = conv.participants.find((p) => p.user_id !== selfUserId)?.user
  return other?.avatar_url ?? null
}

export function getConversationTitle(
  conv: Conversation,
  selfUserId: number,
): string {
  if (conv.display_name?.trim()) return conv.display_name.trim()
  if (conv.conversation_name?.trim()) return conv.conversation_name.trim()
  // if (conv.name?.trim()) return conv.name
  if (conv.type === 'direct') {
    const other = conv.participants.find((p) => p.user_id !== selfUserId)?.user
    const label = other?.display_name?.trim() || other?.name?.trim()
    return label || 'Direct message'
  }
  return 'Conversation'
}

export function unwrapApi<T>(
  body: ApiResponse<T>,
): { data: T; meta: ApiResponse<T>['meta'] } {
  return { data: body.data, meta: body.meta }
}
