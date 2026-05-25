import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { QUERY_KEYS } from '@/constants/queryKeys'
import { TYPING_INDICATOR_CLEAR_MS } from '@/constants/config'
import {
  appendOrMergeMessageInCache,
  removeMessageFromCache,
  upsertOwnMessageInCache,
} from '@/features/messaging/messageCache'
import { applyNewMessagePreview } from '@/features/messaging/conversationCache'
import { useEcho } from '@/hooks/useEcho'
import { EchoService } from '@/services/echoService'
import { useMessagingStore } from '@/store/messagingStore'
import type { Conversation } from '@/types/conversation'
import type { InfiniteData } from '@tanstack/react-query'
import type { MessagesPage } from '@/features/messaging/types'

export function useMessagingRealtime(
  conversation: Conversation | null,
  selfUserId?: number,
) {
  const echo = useEcho()
  const queryClient = useQueryClient()
  const setTypingUser = useMessagingStore((s) => s.setTypingUser)
  const clearTypingUser = useMessagingStore((s) => s.clearTypingUser)
  const activeUuid = useMessagingStore((s) => s.activeConversationUuid)
  const typingTimers = React.useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map(),
  )

  React.useEffect(() => {
    if (!echo || !conversation) return

    const svc = new EchoService(echo)
    const uuid = conversation.uuid
    const convId = conversation.id

    const clearTypingForUser = (userId: number) => {
      const existing = typingTimers.current.get(userId)
      if (existing) clearTimeout(existing)
      typingTimers.current.set(
        userId,
        setTimeout(() => {
          clearTypingUser(uuid, userId)
          typingTimers.current.delete(userId)
        }, TYPING_INDICATOR_CLEAR_MS),
      )
    }

    return svc.subscribeConversation(
      convId,
      {
        onMessageSent: (msg) => {
          if (typeof selfUserId === 'number' && msg.sender.id === selfUserId) {
            upsertOwnMessageInCache(queryClient, uuid, msg)
          } else {
            appendOrMergeMessageInCache(queryClient, uuid, msg)
          }
          if (typeof selfUserId === 'number' && selfUserId > 0) {
            applyNewMessagePreview(queryClient, uuid, msg, {
              selfUserId,
              isActiveConversation: activeUuid === uuid,
            })
          }
        },
        onMessageEdited: (messageUuid, body, editedAt) => {
          queryClient.setQueryData<InfiniteData<MessagesPage>>(
            QUERY_KEYS.messages(uuid),
            (old) => {
              if (!old) return old
              const pages = old.pages.map((p) => ({
                ...p,
                messages: p.messages.map((m) =>
                  m.uuid === messageUuid
                    ? { ...m, body, edited_at: editedAt }
                    : m,
                ),
              }))
              return { ...old, pages }
            },
          )
        },
        onMessageDeleted: (messageUuid) => {
          removeMessageFromCache(queryClient, uuid, messageUuid)
        },
        onMessageRead: () => {
          void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.messages(uuid) })
        },
      },
      {
        // Presence join/leave can fire frequently (especially initial `here` batch),
        // so avoid invalidating conversation detail on every presence change.
        onJoin: () => {},
        onLeave: () => {},
        onTyping: (tu) => {
          setTypingUser(uuid, tu)
          if (tu.is_typing) {
            clearTypingForUser(tu.user_id)
          } else {
            const existing = typingTimers.current.get(tu.user_id)
            if (existing) clearTimeout(existing)
            typingTimers.current.delete(tu.user_id)
            clearTypingUser(uuid, tu.user_id)
          }
        },
      },
    )
  }, [
    echo,
    conversation,
    queryClient,
    setTypingUser,
    clearTypingUser,
    activeUuid,
    selfUserId,
  ])
}
