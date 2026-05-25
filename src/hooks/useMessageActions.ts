import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { showError } from '@/lib/sweetAlert'

import {
  deleteMessage as deleteMessageApi,
  editMessage as editMessageApi,
  markAsRead as markAsReadApi,
  sendMessage as sendMessageApi,
} from '@/api/messages'
import { QUERY_KEYS } from '@/constants/queryKeys'
import {
  appendOrMergeMessageInCache,
  ensureMessagesInfiniteData,
  removeMessageFromCache,
  replaceTempMessageInCache,
} from '@/features/messaging/messageCache'
import { applyNewMessagePreview } from '@/features/messaging/conversationCache'
import type { Message } from '@/types/message'
import type { MessagingUser } from '@/types/user'

import type { MessagesPage } from '@/features/messaging/types'
import type { InfiniteData } from '@tanstack/react-query'

export function useMessageActions(
  conversationUuid: string | null,
  currentUser: MessagingUser | null,
) {
  const queryClient = useQueryClient()
  const readTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const sendMutation = useMutation({
    mutationFn: async (vars: {
      body: string | null
      attachmentIds?: number[]
      parentUuid?: string | null
      parentMessage?: Message | null
    }) => {
      if (!conversationUuid) throw new Error('No conversation')
      return sendMessageApi(
        conversationUuid,
        vars.body,
        vars.attachmentIds,
        vars.parentUuid,
      )
    },
  })

  const sendMessage = React.useCallback(
    async (
      body: string | null,
      attachmentIds?: number[],
      parentUuid?: string | null,
      parentMessage?: Message | null,
    ) => {
      if (!conversationUuid || !currentUser) return
      const trimmed = body?.trim() ?? ''
      const tempId = crypto.randomUUID()
      const optimistic: Message = {
        uuid: tempId,
        conversation_id: 0,
        sender: currentUser,
        parent: parentMessage ?? null,
        parent_uuid: parentUuid ?? null,
        body: trimmed || null,
        type: attachmentIds?.length ? 'attachment' : 'text',
        status: 'sending',
        attachments: [],
        reads: [],
        edited_at: null,
        created_at: new Date().toISOString(),
        _isOptimistic: true,
        _tempId: tempId,
      }
      queryClient.setQueryData<InfiniteData<MessagesPage>>(
        QUERY_KEYS.messages(conversationUuid),
        (old) => {
          const base = ensureMessagesInfiniteData(old)
          const first = base.pages[0] ?? { messages: [], nextCursor: null }
          return {
            ...base,
            pages: [
              {
                ...first,
                messages: [optimistic, ...first.messages],
              },
              ...base.pages.slice(1),
            ],
          }
        },
      )
      try {
        const real = await sendMutation.mutateAsync({
          body: trimmed || null,
          attachmentIds,
          parentUuid,
          parentMessage,
        })
        replaceTempMessageInCache(queryClient, conversationUuid, tempId, real)
        applyNewMessagePreview(queryClient, conversationUuid, real, {
          selfUserId: currentUser.id,
          isActiveConversation: true,
        })
      } catch {
        showError('Failed to send message')
        queryClient.setQueryData<InfiniteData<MessagesPage>>(
          QUERY_KEYS.messages(conversationUuid),
          (old) => {
            if (!old) return old
            const pages = old.pages.map((p) => ({
              ...p,
              messages: p.messages.map((m) =>
                m.uuid === tempId
                  ? { ...m, _failed: true, status: 'sending' as const }
                  : m,
              ),
            }))
            return { ...old, pages }
          },
        )
      }
    },
    [conversationUuid, currentUser, queryClient, sendMutation],
  )

  const editMutation = useMutation({
    mutationFn: (vars: { uuid: string; body: string }) =>
      editMessageApi(vars.uuid, vars.body),
    onSuccess: (msg) => {
      if (!conversationUuid) return
      appendOrMergeMessageInCache(queryClient, conversationUuid, msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => deleteMessageApi(uuid),
    onSuccess: (_, uuid) => {
      if (!conversationUuid) return
      removeMessageFromCache(queryClient, conversationUuid, uuid)
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations })
    },
  })

  const readMutation = useMutation({
    mutationFn: (uuid: string) => markAsReadApi(uuid),
  })

  const markAsRead = React.useCallback(
    (uuid: string) => {
      if (readTimer.current) clearTimeout(readTimer.current)
      readTimer.current = setTimeout(() => {
        readMutation.mutate(uuid)
      }, 500)
    },
    [readMutation],
  )

  return {
    sendMessage,
    editMessage: (uuid: string, body: string) =>
      editMutation.mutateAsync({ uuid, body }),
    deleteMessage: (uuid: string) => deleteMutation.mutateAsync(uuid),
    markAsRead,
    isSending: sendMutation.isPending,
  }
}
