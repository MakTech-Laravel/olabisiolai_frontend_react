export type UserStatus = 'online' | 'offline' | 'away'

export interface MessagingUser {
  id: number
  uuid?: string
  name: string
  email?: string
  avatar: string | null
  status: UserStatus
  last_seen_at: string | null
}
