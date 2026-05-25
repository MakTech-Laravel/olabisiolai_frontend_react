import type { Attachment } from '@/types/attachment'
import type { MessagingUser } from '@/types/user'

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'seen'
export type MessageType = 'text' | 'attachment' | 'system'

export interface MessageRead {
  user_id: number
  user: Pick<MessagingUser, 'id' | 'name' | 'avatar'>
  read_at: string
}

export interface Message {
  id?: number
  uuid: string
  conversation_id: number
  sender: MessagingUser
  parent: Message | null
  parent_uuid?: string | null
  body: string | null
  type: MessageType
  status: MessageStatus
  attachments: Attachment[]
  reads: MessageRead[]
  read_by?: number[]
  edited_at: string | null
  created_at: string
  updated_at?: string
  _isOptimistic?: boolean
  _tempId?: string
  _failed?: boolean
}

export interface TypingUser {
  user_id: number
  user_name: string
  is_typing: boolean
}
