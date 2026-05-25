import { create } from 'zustand'

import type { Conversation } from '@/types/conversation'
import type { Message, TypingUser } from '@/types/message'

interface MessagingState {
  activeConversationUuid: string | null
  setActiveConversation: (uuid: string | null) => void

  conversations: Conversation[]
  setConversations: (conversations: Conversation[]) => void
  updateConversation: (uuid: string, updates: Partial<Conversation>) => void
  moveConversationToTop: (uuid: string) => void

  messages: Record<string, Message[]>
  prependMessages: (conversationUuid: string, messages: Message[]) => void
  appendMessage: (conversationUuid: string, message: Message) => void
  updateMessage: (
    conversationUuid: string,
    uuid: string,
    updates: Partial<Message>,
  ) => void
  removeMessage: (conversationUuid: string, uuid: string) => void
  replaceOptimisticMessage: (
    conversationUuid: string,
    tempId: string,
    message: Message,
  ) => void
  setMessagesForConversation: (conversationUuid: string, messages: Message[]) => void

  typingUsers: Record<string, TypingUser[]>
  setTypingUser: (conversationUuid: string, user: TypingUser) => void
  clearTypingUser: (conversationUuid: string, userId: number) => void

  unreadCounts: Record<string, number>
  setUnreadCount: (conversationUuid: string, count: number) => void
  incrementUnread: (conversationUuid: string) => void
  clearUnread: (conversationUuid: string) => void
}

function sortConversations(list: Conversation[]): Conversation[] {
  return [...list].sort((a, b) => {
    const ta = a.last_message?.created_at ?? a.updated_at
    const tb = b.last_message?.created_at ?? b.updated_at
    return tb.localeCompare(ta)
  })
}

export const useMessagingStore = create<MessagingState>((set, get) => ({
  activeConversationUuid: null,
  setActiveConversation: (uuid) => {
    if (get().activeConversationUuid === uuid) return
    set({ activeConversationUuid: uuid })
  },

  conversations: [],
  setConversations: (conversations) =>
    set({ conversations: sortConversations(conversations) }),
  updateConversation: (uuid, updates) =>
    set((s) => ({
      conversations: sortConversations(
        s.conversations.map((c) => (c.uuid === uuid ? { ...c, ...updates } : c)),
      ),
    })),
  moveConversationToTop: (uuid) =>
    set((s) => {
      const idx = s.conversations.findIndex((c) => c.uuid === uuid)
      if (idx <= 0) return s
      const next = [...s.conversations]
      const [item] = next.splice(idx, 1)
      return { conversations: [item, ...next] }
    }),

  messages: {},
  prependMessages: (conversationUuid, newMsgs) =>
    set((s) => {
      const cur = s.messages[conversationUuid] ?? []
      const existing = new Set(cur.map((m) => m.uuid))
      const merged = [...newMsgs.filter((m) => !existing.has(m.uuid)), ...cur]
      return {
        messages: { ...s.messages, [conversationUuid]: merged },
      }
    }),
  appendMessage: (conversationUuid, message) =>
    set((s) => {
      const cur = s.messages[conversationUuid] ?? []
      if (cur.some((m) => m.uuid === message.uuid)) {
        return {
          messages: {
            ...s.messages,
            [conversationUuid]: cur.map((m) =>
              m.uuid === message.uuid ? { ...m, ...message } : m,
            ),
          },
        }
      }
      return {
        messages: { ...s.messages, [conversationUuid]: [...cur, message] },
      }
    }),
  updateMessage: (conversationUuid, uuid, updates) =>
    set((s) => {
      const cur = s.messages[conversationUuid] ?? []
      return {
        messages: {
          ...s.messages,
          [conversationUuid]: cur.map((m) =>
            m.uuid === uuid ? { ...m, ...updates } : m,
          ),
        },
      }
    }),
  removeMessage: (conversationUuid, uuid) =>
    set((s) => {
      const cur = s.messages[conversationUuid] ?? []
      return {
        messages: {
          ...s.messages,
          [conversationUuid]: cur.filter((m) => m.uuid !== uuid),
        },
      }
    }),
  replaceOptimisticMessage: (conversationUuid, tempId, message) =>
    set((s) => {
      const cur = s.messages[conversationUuid] ?? []
      return {
        messages: {
          ...s.messages,
          [conversationUuid]: cur.map((m) =>
            m.uuid === tempId || m._tempId === tempId ? message : m,
          ),
        },
      }
    }),
  setMessagesForConversation: (conversationUuid, messages) =>
    set((s) => ({
      messages: { ...s.messages, [conversationUuid]: messages },
    })),

  typingUsers: {},
  setTypingUser: (conversationUuid, user) =>
    set((s) => {
      const cur = s.typingUsers[conversationUuid] ?? []
      const filtered = cur.filter((u) => u.user_id !== user.user_id)
      const next =
        user.is_typing ? [...filtered, user] : filtered
      return {
        typingUsers: { ...s.typingUsers, [conversationUuid]: next },
      }
    }),
  clearTypingUser: (conversationUuid, userId) =>
    set((s) => {
      const cur = s.typingUsers[conversationUuid] ?? []
      return {
        typingUsers: {
          ...s.typingUsers,
          [conversationUuid]: cur.filter((u) => u.user_id !== userId),
        },
      }
    }),

  unreadCounts: {},
  setUnreadCount: (conversationUuid, count) =>
    set((s) => ({
      unreadCounts: { ...s.unreadCounts, [conversationUuid]: count },
    })),
  incrementUnread: (conversationUuid) =>
    set((s) => {
      const n = s.unreadCounts[conversationUuid] ?? 0
      return {
        unreadCounts: { ...s.unreadCounts, [conversationUuid]: n + 1 },
      }
    }),
  clearUnread: (conversationUuid) =>
    set((s) => {
      const next = { ...s.unreadCounts }
      next[conversationUuid] = 0
      return { unreadCounts: next }
    }),
}))

export function getMessagingStoreState() {
  return useMessagingStore.getState()
}
