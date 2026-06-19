export type FollowerOwnedBusiness = {
  id: number
  business_name: string
  logo_url: string | null
  category_name: string | null
  location: string | null
}

export type ConversationPeer = {
  user_id: number
  id: number
  uuid?: string
  role?: string
  personal_name?: string
  name: string
  display_name?: string
  business_name?: string | null
  business_info_id?: number | null
  avatar_url?: string | null
  is_verified?: boolean
  owned_businesses?: FollowerOwnedBusiness[]
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
    personal_name?: string
    business_name?: string | null
    avatar_url?: string | null
    is_verified?: boolean
    owned_businesses?: FollowerOwnedBusiness[]
    presence: ParticipantPresence | null
  } | null
}

export type ConversationType = 'direct' | 'group' | 'channel'

import type { MessagingUser } from '@/types/user'

export function messagingUserFromParticipant(
  p: ConversationParticipant | undefined,
): MessagingUser | null {
  if (!p?.user) return null
  const st = p.user.presence?.status
  const status =
    st === 'online' || st === 'away' || st === 'offline' ? st : 'offline'
  return {
    id: p.user.id,
    name: p.user.personal_name?.trim() || p.user.display_name?.trim() || p.user.name,
    avatar: p.user.avatar_url ?? null,
    status,
    last_seen_at: p.user.presence?.last_seen_at ?? null,
  }
}
