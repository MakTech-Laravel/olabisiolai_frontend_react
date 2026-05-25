import type { Message } from '@/types/message'

export type MessagesPage = {
  messages: Message[]
  nextCursor: string | null
}
