import * as React from 'react'
import {
  type InfiniteData,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { getMessages } from '@/api/messages'
import { QUERY_KEYS } from '@/constants/queryKeys'
import type { MessagesPage } from '@/features/messaging/types'
import type { Message } from '@/types/message'

export function useInfiniteMessages(conversationUuid: string | null) {
  const queryClient = useQueryClient()

  const query = useInfiniteQuery({
    queryKey: QUERY_KEYS.messages(conversationUuid ?? ''),
    enabled: Boolean(conversationUuid),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const { messages, meta } = await getMessages(
        conversationUuid!,
        pageParam ?? undefined,
      )
      return {
        messages,
        nextCursor: meta?.pagination?.next_cursor ?? null,
      } satisfies MessagesPage
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

  const appendMessage = React.useCallback(
    (message: Message) => {
      if (!conversationUuid) return
      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        QUERY_KEYS.messages(conversationUuid),
        (old) => {
          if (!old?.pages.length) return old
          const pages = old.pages.map((p) => ({
            ...p,
            messages: p.messages.filter((m) => m.uuid !== message.uuid),
          }))
          const first = pages[0]
          if (!first) return old
          pages[0] = {
            ...first,
            messages: [message, ...first.messages],
          }
          return { ...old, pages }
        },
      )
    },
    [conversationUuid, queryClient],
  )

  return { ...query, appendMessage }
}
