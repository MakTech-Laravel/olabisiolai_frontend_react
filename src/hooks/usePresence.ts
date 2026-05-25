import { useMemo } from 'react'

import type { Conversation } from '@/types/conversation'
import { messagingUserFromParticipant } from '@/types/conversation'

/** Presence is driven by participant payload + realtime invalidation; optional extension point. */
export function usePresence(conversation: Conversation | null, selfUserId: number) {
  return useMemo(() => {
    if (!conversation) return { onlineUsers: [] as ReturnType<typeof messagingUserFromParticipant>[], count: 0 }
    const online = conversation.participants
      .map((p) => messagingUserFromParticipant(p))
      .filter(
        (u): u is NonNullable<typeof u> =>
          u !== null && u.id !== selfUserId && u.status === 'online',
      )
    return { onlineUsers: online, count: online.length }
  }, [conversation, selfUserId])
}
