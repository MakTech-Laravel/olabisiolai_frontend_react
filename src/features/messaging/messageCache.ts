import type { InfiniteData, QueryClient } from '@tanstack/react-query'

import { QUERY_KEYS } from '@/constants/queryKeys'
import type { Message } from '@/types/message'

import type { MessagesPage } from '@/features/messaging/types'

function emptyMessagesPage(): MessagesPage {
  return { messages: [], nextCursor: null }
}

/** Ensure react-query infinite data exists before optimistic/realtime writes. */
export function ensureMessagesInfiniteData(
  old: InfiniteData<MessagesPage> | undefined,
): InfiniteData<MessagesPage> {
  if (old?.pages?.length) {
    return old
  }
  return {
    pageParams: [null],
    pages: [emptyMessagesPage()],
  }
}

function removeMessageEverywhere(
  pages: MessagesPage[],
  predicate: (m: Message) => boolean,
): MessagesPage[] {
  return pages.map((p) => ({
    ...p,
    messages: p.messages.filter((m) => !predicate(m)),
  }))
}

function cleanDeliveredMessage(message: Message): Message {
  return {
    ...message,
    _isOptimistic: undefined,
    _tempId: undefined,
    _failed: undefined,
  }
}

function matchesPendingOwnMessage(m: Message, message: Message): boolean {
  return Boolean(
    m._isOptimistic &&
      m.sender.id === message.sender.id &&
      m.body != null &&
      m.body === message.body,
  )
}

export function appendOrMergeMessageInCache(
  queryClient: QueryClient,
  conversationUuid: string,
  message: Message,
) {
  queryClient.setQueryData<InfiniteData<MessagesPage>>(
    QUERY_KEYS.messages(conversationUuid),
    (old) => {
      const base = ensureMessagesInfiniteData(old)
      const pages = removeMessageEverywhere(base.pages, (m) => m.uuid === message.uuid)
      const first = pages[0] ?? emptyMessagesPage()
      pages[0] = {
        ...first,
        messages: [
          cleanDeliveredMessage(message),
          ...first.messages.filter((m) => {
            if (m.uuid === message.uuid) return false
            if (matchesPendingOwnMessage(m, message)) return false
            return true
          }),
        ],
      }
      return { ...base, pages }
    },
  )
}

/** Realtime/API path for the current user's message (avoids echo + replace races). */
export function upsertOwnMessageInCache(
  queryClient: QueryClient,
  conversationUuid: string,
  message: Message,
) {
  appendOrMergeMessageInCache(queryClient, conversationUuid, message)
}

export function removeMessageFromCache(
  queryClient: QueryClient,
  conversationUuid: string,
  messageUuid: string,
) {
  queryClient.setQueryData<InfiniteData<MessagesPage>>(
    QUERY_KEYS.messages(conversationUuid),
    (old) => {
      if (!old) return old
      const pages = old.pages.map((p) => ({
        ...p,
        messages: p.messages.filter((m) => m.uuid !== messageUuid),
      }))
      return { ...old, pages }
    },
  )
}

export function replaceTempMessageInCache(
  queryClient: QueryClient,
  conversationUuid: string,
  tempId: string,
  real: Message,
) {
  queryClient.setQueryData<InfiniteData<MessagesPage>>(
    QUERY_KEYS.messages(conversationUuid),
    (old) => {
      const base = ensureMessagesInfiniteData(old)
      const delivered = cleanDeliveredMessage(real)

      const pages = base.pages.map((page, pageIndex) => {
        if (pageIndex !== 0) {
          return {
            ...page,
            messages: page.messages.filter((m) => m.uuid !== real.uuid),
          }
        }

        let replacedTemp = false
        const next: Message[] = []

        for (const m of page.messages) {
          if (m.uuid === tempId || m._tempId === tempId) {
            if (!replacedTemp) {
              next.push(delivered)
              replacedTemp = true
            }
            continue
          }
          if (m.uuid === real.uuid) continue
          if (matchesPendingOwnMessage(m, real)) continue
          next.push(m)
        }

        if (!replacedTemp && !next.some((m) => m.uuid === real.uuid)) {
          next.unshift(delivered)
        }

        return { ...page, messages: next }
      })

      return { ...base, pages }
    },
  )
}
