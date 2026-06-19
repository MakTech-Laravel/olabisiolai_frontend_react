export type {
  ConversationPeer,
  ConversationParticipant,
  ConversationType,
  FollowerOwnedBusiness,
  ParticipantPresence,
} from '@/types/messagingPeer'

import type { Message } from '@/types/message'
import type { MessagingUser } from '@/types/user'
import type {
  ConversationParticipant,
  ConversationPeer,
  ConversationType,
} from '@/types/messagingPeer'
import { messagingUserFromParticipant } from '@/types/messagingPeer'

export interface Conversation {
  id: number
  uuid: string
  type: ConversationType
  name: string | null
  display_name?: string
  conversation_name?: string
  conversation_image_url?: string | null
  peer?: ConversationPeer | null
  participants: ConversationParticipant[]
  last_message: Message | null
  last_message_preview?: string | null
  last_message_at?: string | null
  unread_count: number
  is_archived: boolean
  tenant_id?: number | null
  business_info_id?: number | null
  created_at: string
  updated_at: string
}

export { messagingUserFromParticipant }

export type { MessagingUser }
