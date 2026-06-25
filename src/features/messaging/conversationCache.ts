import type { QueryClient } from '@tanstack/react-query'

import { QUERY_KEYS } from '@/constants/queryKeys'
import { getConversationPreviewTime, getMessagePreviewText } from '@/utils/messageUtils'
import type { Conversation, ParticipantPresence } from '@/types/conversation'
import type { Message } from '@/types/message'

function patchAllConversationLists(
  queryClient: QueryClient,
  patchList: (list: Conversation[] | undefined) => Conversation[] | undefined,
) {
  queryClient.setQueriesData<Conversation[]>({ queryKey: ['conversations'] }, (old) => {
    if (!Array.isArray(old)) return old
    return patchList(old) ?? old
  })
}

export function patchConversationPeerPresence(
  conversation: Conversation,
  peerUserId: number,
  presence: ParticipantPresence,
): Conversation {
  const participants = conversation.participants.map((p) => {
    if (p.user_id !== peerUserId || !p.user) return p
    return { ...p, user: { ...p.user, presence } }
  })

  const peer =
    conversation.peer &&
      (conversation.peer.user_id === peerUserId || conversation.peer.id === peerUserId)
      ? { ...conversation.peer, presence }
      : conversation.peer

  return { ...conversation, participants, peer }
}

/** Keep inbox + thread peer online/offline in sync with Echo presence. */
export function setPeerPresenceInCaches(
  queryClient: QueryClient,
  conversationUuid: string,
  peerUserId: number,
  presence: ParticipantPresence,
) {
  const patchList = (list: Conversation[] | undefined): Conversation[] | undefined => {
    if (!list?.length) return list
    let changed = false
    const next = list.map((c) => {
      if (c.uuid !== conversationUuid) return c
      changed = true
      return patchConversationPeerPresence(c, peerUserId, presence)
    })
    return changed ? next : list
  }

  patchAllConversationLists(queryClient, patchList)

  queryClient.setQueryData<Conversation>(
    QUERY_KEYS.conversation(conversationUuid),
    (old) =>
      old ? patchConversationPeerPresence(old, peerUserId, presence) : old,
  )

  queryClient.setQueryData<Conversation>(['vendor-admin-chat'], (old) =>
    old?.uuid === conversationUuid
      ? patchConversationPeerPresence(old, peerUserId, presence)
      : old,
  )
}

function sortConversations(list: Conversation[]): Conversation[] {
  return [...list].sort((a, b) => {
    const ta = getConversationPreviewTime(a)
    const tb = getConversationPreviewTime(b)
    return tb.localeCompare(ta)
  })
}

export function updateConversationInCache(
  queryClient: QueryClient,
  conversationUuid: string,
  updater: (c: Conversation) => Conversation,
) {
  patchAllConversationLists(queryClient, (old) => {
    if (!old?.length) return old
    let changed = false
    const next = old.map((c) => {
      if (c.uuid !== conversationUuid) return c
      changed = true
      return updater(c)
    })
    return changed ? sortConversations(next) : old
  })
}

export function bumpConversationToTopInCache(
  queryClient: QueryClient,
  conversationUuid: string,
) {
  patchAllConversationLists(queryClient, (old) => {
    if (!old?.length) return old
    const idx = old.findIndex((c) => c.uuid === conversationUuid)
    if (idx <= 0) return old
    const next = [...old]
    const [item] = next.splice(idx, 1)
    return item ? [item, ...next] : old
  })
}

export function applyNewMessagePreview(
  queryClient: QueryClient,
  conversationUuid: string,
  message: Message,
  opts: {
    selfUserId: number
    isActiveConversation: boolean
  },
) {
  updateConversationInCache(queryClient, conversationUuid, (c) => {
    const unread =
      message.sender.id !== opts.selfUserId && !opts.isActiveConversation
        ? (c.unread_count ?? 0) + 1
        : c.unread_count

    return {
      ...c,
      last_message: message,
      last_message_preview: getMessagePreviewText(message),
      last_message_at: message.created_at ?? c.last_message_at ?? null,
      unread_count: unread,
      updated_at: message.created_at ?? c.updated_at,
    }
  })
  bumpConversationToTopInCache(queryClient, conversationUuid)
}

/** Prime caches after creating a thread so the chat opens without a fetch error. */
export function seedNewConversationInCache(
  queryClient: QueryClient,
  conversation: Conversation,
  inboxScope: 'personal' | `business:${number}` = 'personal',
) {
  queryClient.setQueryData(QUERY_KEYS.conversation(conversation.uuid), conversation)

  const listKey = QUERY_KEYS.conversations(
    inboxScope === 'personal' ? 'personal' : inboxScope,
  )

  queryClient.setQueryData<Conversation[]>(listKey, (old) => {
    const list = Array.isArray(old) ? old : []
    if (list.some((c) => c.uuid === conversation.uuid)) return list
    return [conversation, ...list]
  })
}
