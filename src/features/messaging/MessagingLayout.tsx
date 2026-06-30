import * as React from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

import { ConversationList } from '@/components/chat/ConversationList'
import { ChatErrorBoundary } from '@/components/ui/ChatErrorBoundary'
import { useConversations, type ConversationInboxParams } from '@/hooks/useConversations'
import { ConversationView } from '@/features/messaging/ConversationView'
import type { MessagingInboxKey } from '@/features/messaging/MessagingInboxTabs'
import { useMessagingStore } from '@/store/messagingStore'
import type { AuthUser } from '@/auth/types'
import type { Conversation } from '@/types/conversation'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { getMessages } from '@/api/messages'
import type { MessagesPage } from '@/features/messaging/types'
import { useMessagingPresenceLifecycle } from '@/hooks/useMessagingPresenceLifecycle'
import { hasPendingDirectMessageState } from '@/lib/directMessage'
import { cn } from '@/lib/utils'

export type MessagingLayoutProps = {
  selfUser: AuthUser | null
  /**
   * When set (e.g. `'c'`), the active thread is read from and written to `?c=<uuid>`
   * so `/messages` stays shareable and refresh-safe.
   */
  conversationQueryParam?: string
  /** Lock the inbox to personal or a single business (hides multi-inbox tabs). */
  inboxScope: MessagingInboxKey
  title?: string
  subtitle?: string
}

function inboxParamsFromScope(inboxScope: MessagingInboxKey): ConversationInboxParams | undefined {
  if (inboxScope === 'all') return undefined
  if (inboxScope === 'personal') return { inbox: 'personal' }
  if (inboxScope.startsWith('business:')) {
    const businessId = Number(inboxScope.replace('business:', ''))
    if (Number.isFinite(businessId) && businessId > 0) {
      return { businessInfoId: businessId }
    }
  }
  return undefined
}

export function MessagingLayout({
  selfUser,
  conversationQueryParam,
  inboxScope,
  title = 'Messages',
  subtitle,
}: MessagingLayoutProps) {
  const selfId = selfUser ? Number(selfUser.id) : 0
  const location = useLocation()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const pendingDirectMessage = hasPendingDirectMessageState(location.state)
  const urlConversationUuid = conversationQueryParam
    ? searchParams.get(conversationQueryParam)
    : null

  const activeUuid = useMessagingStore((s) => s.activeConversationUuid)
  const setActive = useMessagingStore((s) => s.setActiveConversation)
  const inboxParams = React.useMemo(() => inboxParamsFromScope(inboxScope), [inboxScope])
  const { data: conversations, isLoading } = useConversations(inboxParams)
  useMessagingPresenceLifecycle(Boolean(selfId))

  const resolvedActiveUuid = activeUuid ?? urlConversationUuid

  const showListOnMobile = !resolvedActiveUuid
  const showChatOnMobile = Boolean(resolvedActiveUuid)

  const prefetchMessages = React.useCallback(
    (uuid: string) => {
      void queryClient.prefetchInfiniteQuery({
        queryKey: QUERY_KEYS.messages(uuid),
        initialPageParam: null as string | null,
        queryFn: async ({ pageParam }) => {
          const { messages, meta } = await getMessages(uuid, pageParam ?? undefined)
          return {
            messages,
            nextCursor: meta?.pagination?.next_cursor ?? null,
          } satisfies MessagesPage
        },
        getNextPageParam: (last: MessagesPage) => last.nextCursor ?? undefined,
      })
    },
    [queryClient],
  )

  const setQueryConversation = React.useCallback(
    (uuid: string | null) => {
      if (!conversationQueryParam) return
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (uuid) {
            next.set(conversationQueryParam, uuid)
          } else {
            next.delete(conversationQueryParam)
          }
          return next
        },
        { replace: true },
      )
    },
    [conversationQueryParam, setSearchParams],
  )

  React.useEffect(() => {
    if (!conversationQueryParam) {
      if (urlConversationUuid) {
        setActive(urlConversationUuid)
      } else {
        setActive(null)
      }
      return
    }

    if (urlConversationUuid) {
      setActive(urlConversationUuid)
      prefetchMessages(urlConversationUuid)
      return
    }

    if (pendingDirectMessage) {
      setActive(null)
      return
    }

    setActive(null)
  }, [
    conversationQueryParam,
    urlConversationUuid,
    setActive,
    prefetchMessages,
    pendingDirectMessage,
  ])

  const onSearchPick = React.useCallback(
    (c: Conversation) => {
      prefetchMessages(c.uuid)
      setActive(c.uuid)
      if (conversationQueryParam) {
        setQueryConversation(c.uuid)
      }
    },
    [prefetchMessages, setActive, conversationQueryParam, setQueryConversation],
  )

  const selectConversation = React.useCallback(
    (uuid: string) => {
      prefetchMessages(uuid)
      setActive(uuid)
      if (conversationQueryParam) {
        setQueryConversation(uuid)
      }
    },
    [prefetchMessages, setActive, conversationQueryParam, setQueryConversation],
  )

  const clearConversation = React.useCallback(() => {
    setActive(null)
    setQueryConversation(null)
  }, [setActive, setQueryConversation])

  const emptyDescription =
    inboxScope === 'personal'
      ? 'Message a business from their page and your chats will appear here.'
      : 'Customer enquiries for this business will appear here.'

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col gap-2 p-2 lg:h-full lg:p-4">
      <div className="shrink-0 px-2">
        <h1 className="font-heading text-xl font-black tracking-tight text-ink sm:text-2xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-[12.5px] text-chat-meta">{subtitle}</p>
        ) : null}
      </div>
      <ConversationList
        activeUuid={resolvedActiveUuid}
        selfUserId={selfId}
        onSelect={selectConversation}
        onSearchPick={onSearchPick}
        conversations={conversations ?? []}
        isLoading={isLoading}
        emptyDescription={emptyDescription}
      />
    </div>
  )

  return (
    <ChatErrorBoundary>
      <div className="h-full min-h-0 flex-1 overflow-hidden">
        <section
          className={cn(
            'h-full min-h-0 overflow-hidden',
            'max-lg:flex max-lg:flex-col',
            'lg:grid lg:grid-cols-[minmax(380px,34%)_minmax(0,1fr)]',
          )}
        >
          <aside
            className={cn(
              'flex h-full min-h-0 flex-col overflow-hidden border-chat-border bg-chat-input-bg',
              'max-lg:w-full max-lg:flex-1 max-lg:border-b',
              'lg:border-r',
              showListOnMobile ? 'flex' : 'hidden lg:flex',
            )}
          >
            {sidebar}
          </aside>
          <div
            className={cn(
              'flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-chat-surface',
              showChatOnMobile ? 'flex' : 'hidden lg:flex',
            )}
          >
            <ConversationView
              conversationUuid={resolvedActiveUuid}
              selfUser={selfUser}
              onBack={clearConversation}
            />
          </div>
        </section>
      </div>
    </ChatErrorBoundary>
  )
}
