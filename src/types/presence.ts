import type { MessagingUser } from '@/types/user'

export interface PresenceUser {
  id: number
  name: string
  avatar: string | null
}

export type PresenceMember = MessagingUser & { socketId?: string }
