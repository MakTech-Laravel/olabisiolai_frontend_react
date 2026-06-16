import * as React from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

import { ConversationList } from '@/components/chat/ConversationList'
import { MobileDrawer } from '@/components/layout/MobileDrawer'
import { ChatErrorBoundary } from '@/components/ui/ChatErrorBoundary'
import { Button } from '@/components/ui/button'
import { useConversations } from '@/hooks/useConversations'
import {
  filterConversationsByInbox,
  MessagingInboxTabs,
  type MessagingInboxKey,
} from '@/features/messaging/MessagingInboxTabs'
import { ConversationView } from '@/features/messaging/ConversationView'
import { NewConversationModal } from '@/features/messaging/NewConversationModal'
import { useMessagingStore } from '@/store/messagingStore'
import { useUiStore } from '@/store/uiStore'
import type { AuthUser } from '@/auth/types'
import type { Conversation } from '@/types/conversation'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { getMessages } from '@/api/messages'
import type { MessagesPage } from '@/features/messaging/types'
import { useMessagingPresenceLifecycle } from '@/hooks/useMessagingPresenceLifecycle'
import { hasPendingDirectMessageState } from '@/lib/directMessage'

export type MessagingLayoutProps = {
  selfUser: AuthUser | null
  /**
   * When set (e.g. `'c'`), the active thread is read from and written to `?c=<uuid>`
   * so `/messages` stays shareable and refresh-safe.
   */
  conversationQueryParam?: string
}

export function MessagingLayout({
  selfUser,
  conversationQueryParam,
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
  const modalOpen = useUiStore((s) => s.isNewConversationModalOpen)
  const setModal = useUiStore((s) => s.setNewConversationModalOpen)
  const drawer = useUiStore((s) => s.isMobileDrawerOpen)
  const setDrawer = useUiStore((s) => s.setMobileDrawer)
  const { data: conversations } = useConversations()
  useMessagingPresenceLifecycle(Boolean(selfId))
  const firstConversationUuid = conversations?.[0]?.uuid ?? null
  const [activeInbox, setActiveInbox] = React.useState<MessagingInboxKey>('all')
  const filteredConversations = React.useMemo(
    () => filterConversationsByInbox(conversations ?? [], activeInbox),
    [conversations, activeInbox],
  )

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
    (uuid: string) => {
      if (!conversationQueryParam) return
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set(conversationQueryParam, uuid)
          return next
        },
        { replace: true },
      )
    },
    [conversationQueryParam, setSearchParams],
  )

  React.useEffect(() => {
    if (!conversationQueryParam) {
      if (activeUuid || !firstConversationUuid) return
      prefetchMessages(firstConversationUuid)
      setActive(firstConversationUuid)
      return
    }

    if (urlConversationUuid) {
      setActive(urlConversationUuid)
      return
    }

    // Wait for DirectMessageButton / post-login hook to create thread and set ?c=
    if (pendingDirectMessage) {
      setActive(null)
      return
    }

    if (firstConversationUuid) {
      prefetchMessages(firstConversationUuid)
      setActive(firstConversationUuid)
      setQueryConversation(firstConversationUuid)
      return
    }

    setActive(null)
  }, [
    conversationQueryParam,
    urlConversationUuid,
    firstConversationUuid,
    setActive,
    setQueryConversation,
    activeUuid,
    prefetchMessages,
    pendingDirectMessage,
  ])

  const onSearchPick = React.useCallback(
    (c: Conversation) => {
      prefetchMessages(c.uuid)
      setActive(c.uuid)
      setDrawer(false)
      if (conversationQueryParam) {
        setQueryConversation(c.uuid)
      }
    },
    [prefetchMessages, setActive, setDrawer, conversationQueryParam, setQueryConversation],
  )

  const selectConversation = React.useCallback(
    (uuid: string) => {
      prefetchMessages(uuid)
      setActive(uuid)
      setDrawer(false)
      if (conversationQueryParam) {
        setQueryConversation(uuid)
      }
    },
    [prefetchMessages, setActive, setDrawer, conversationQueryParam, setQueryConversation],
  )

  const sidebar = (
    <div className="flex h-full min-h-[calc(100vh-5rem)] flex-col gap-2 p-2 lg:p-4">
      <div className="flex shrink-0 items-center justify-between gap-2 px-2">
        <h1 className="font-heading text-xl font-black tracking-tight text-ink sm:text-2xl">
          Messages
        </h1>
        <Button
          type="button"
          size="sm"
          className="rounded-full bg-chat-accent text-text-white"
          onClick={() => setModal(true)}
        >
          New
        </Button>
      </div>
      <MessagingInboxTabs
        conversations={conversations ?? []}
        activeInbox={activeInbox}
        onChange={setActiveInbox}
        className="px-2"
      />
      <ConversationList
        activeUuid={activeUuid}
        selfUserId={selfId}
        onSelect={selectConversation}
        onSearchPick={onSearchPick}
        conversations={filteredConversations}
      />
    </div>
  )

  return (
    <ChatErrorBoundary>
      <section className="flex h-[min(720px,calc(100dvh-6rem))] min-h-0 flex-1 overflow-hidden lg:h-[min(780px,calc(100dvh-6rem))]">
        <aside className="hidden h-full min-h-0 w-[320px] shrink-0 flex-col overflow-hidden border-r border-chat-border bg-chat-input-bg lg:flex">
          {sidebar}
        </aside>
        <MobileDrawer open={drawer} onClose={() => setDrawer(false)} title="Messages">
          {sidebar}
        </MobileDrawer>
        <ConversationView
          conversationUuid={activeUuid}
          selfUser={selfUser}
          onOpenSidebar={() => setDrawer(true)}
        />
      </section>
      <NewConversationModal
        open={modalOpen}
        onClose={() => setModal(false)}
        onCreated={(uuid) => {
          setActive(uuid)
          if (conversationQueryParam) {
            setQueryConversation(uuid)
          }
        }}
      />
    </ChatErrorBoundary>
  )
}
