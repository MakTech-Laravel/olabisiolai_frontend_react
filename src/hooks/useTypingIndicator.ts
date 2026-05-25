import * as React from 'react'

import { TYPING_SEND_MIN_INTERVAL_MS, TYPING_IDLE_STOP_MS } from '@/constants/config'
import { EMPTY_TYPING_USERS } from '@/constants/messagingUi'
import { useEcho } from '@/hooks/useEcho'
import { EchoService } from '@/services/echoService'
import { useMessagingStore } from '@/store/messagingStore'

type TypingConversation = {
  uuid: string
  id: number
}

type TypingSelf = {
  id: number
  name: string
}

export function useTypingIndicator(
  conversation: TypingConversation | null,
  selfUser: TypingSelf | null,
) {
  const echo = useEcho()
  const typingUsers = useMessagingStore((s) => {
    if (!conversation?.uuid) return EMPTY_TYPING_USERS
    return s.typingUsers[conversation.uuid] ?? EMPTY_TYPING_USERS
  })
  const lastSent = React.useRef(0)
  const idleTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const sendTyping = React.useCallback(
    (isTyping: boolean) => {
      if (!conversation || !selfUser || !echo) return
      const now = Date.now()
      if (isTyping && now - lastSent.current < TYPING_SEND_MIN_INTERVAL_MS) return
      lastSent.current = now
      new EchoService(echo).whisperTyping(conversation.id, {
        user_id: selfUser.id,
        user_name: selfUser.name,
        is_typing: isTyping,
      })
    },
    [conversation, selfUser, echo],
  )

  const signalTyping = React.useCallback(() => {
    sendTyping(true)
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => {
      sendTyping(false)
    }, TYPING_IDLE_STOP_MS)
  }, [sendTyping])

  React.useEffect(() => {
    return () => {
      sendTyping(false)
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [sendTyping])

  return { typingUsers, signalTyping, sendTyping }
}
