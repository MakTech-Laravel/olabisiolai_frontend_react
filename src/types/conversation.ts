import type { Message } from '@/types/message'
import type { MessagingUser } from '@/types/user'

export type ConversationType = 'direct' | 'group' | 'channel'

export type ConversationPeer = {
  user_id: number
  id: number
  uuid?: string
  role?: string
  name: string
  display_name?: string
  /** Vendor listing id when peer is a vendor with a published business profile. */
  business_info_id?: number | null
  avatar_url?: string | null
  is_verified?: boolean
  presence?: ParticipantPresence | null
}

export interface ParticipantPresence {
  status: string
  last_seen_at: string | null
}

export interface ConversationParticipant {
  user_id: number
  role: 'member' | 'admin'
  joined_at: string
  last_read_at: string | null
  is_muted: boolean
  user: {
    id: number
    uuid?: string
    name: string
    display_name?: string
    avatar_url?: string | null
    is_verified?: boolean
    presence: ParticipantPresence | null
  } | null
}

export interface Conversation {
  id: number
  uuid: string
  type: ConversationType
  name: string | null
  /** Viewer-specific title from API (vendor business name or user personal name). */
  display_name?: string
  conversation_name?: string
  conversation_image_url?: string | null
  peer?: ConversationPeer | null
  participants: ConversationParticipant[]
  last_message: Message | null
  /** API fallback when last_message object is omitted. */
  last_message_preview?: string | null
  last_message_at?: string | null
  unread_count: number
  is_archived: boolean
  tenant_id?: number | null
  created_at: string
  updated_at: string
}

export function messagingUserFromParticipant(
  p: ConversationParticipant | undefined,
): MessagingUser | null {
  if (!p?.user) return null
  const st = p.user.presence?.status
  const status =
    st === 'online' || st === 'away' || st === 'offline' ? st : 'offline'
  return {
    id: p.user.id,
    name: p.user.display_name?.trim() || p.user.name,
    avatar: p.user.avatar_url ?? null,
    status,
    last_seen_at: p.user.presence?.last_seen_at ?? null,
  }
}
