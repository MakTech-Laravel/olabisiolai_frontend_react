import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { alert, showError } from '@/lib/sweetAlert'

import { ChatHeader } from '@/components/chat/ChatHeader'
import { InfiniteMessageList } from '@/components/chat/InfiniteMessageList'
import { MessageInput } from '@/components/chat/MessageInput'
import { TypingIndicator } from '@/components/chat/TypingIndicator'
import { ChatErrorBoundary } from '@/components/ui/ChatErrorBoundary'
import type { AuthUser } from '@/auth/types'
import { sendMessageWithAttachments } from '@/api/messages'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { appendOrMergeMessageInCache } from '@/features/messaging/messageCache'
import { applyNewMessagePreview } from '@/features/messaging/conversationCache'
import { useConversation } from '@/hooks/useConversation'
import { useInfiniteMessages } from '@/hooks/useInfiniteMessages'
import { useMessageActions } from '@/hooks/useMessageActions'
import { useMessagingRealtime } from '@/hooks/useMessagingRealtime'
import { useTypingIndicator } from '@/hooks/useTypingIndicator'
import { useAttachmentUpload } from '@/hooks/useAttachmentUpload'
import { useUiStore } from '@/store/uiStore'
import type { Message } from '@/types/message'
import type { MessagingUser } from '@/types/user'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { conversationPeerAvatar } from '@/utils/messageUtils'
import { isPeerOnline } from '@/utils/messageStatus'

function authUserToMessagingUser(u: AuthUser | null): MessagingUser | null {
  if (!u) return null
  return {
    id: Number(u.id),
    name: u.name ?? 'You',
    avatar: null,
    status: 'online',
    last_seen_at: null,
  }
}

export function ConversationView({
  conversationUuid,
  selfUser,
  onOpenSidebar,
}: {
  conversationUuid: string | null
  selfUser: AuthUser | null
  onOpenSidebar?: () => void
}) {
  const queryClient = useQueryClient()
  const { data: conversation, isLoading: convLoading } =
    useConversation(conversationUuid)
  const inf = useInfiniteMessages(conversationUuid)
  const pages = inf.data?.pages ?? []

  const me = authUserToMessagingUser(selfUser)
  const selfId = me?.id ?? 0

  useMessagingRealtime(conversation ?? null, selfId)

  const { sendMessage, editMessage, deleteMessage, markAsRead, isSending } =
    useMessageActions(conversationUuid, me)

  const peerIsOnline = isPeerOnline(conversation?.peer?.presence?.status)
  const peerAvatarUrl = React.useMemo(() => {
    if (!conversation) return null
    const raw = conversationPeerAvatar(conversation, selfId)
    return raw ? resolveMediaUrl(raw, '') || null : null
  }, [conversation, selfId])
  const { typingUsers, signalTyping } = useTypingIndicator(
    conversation ? { uuid: conversation.uuid, id: conversation.id } : null,
    me ? { id: me.id, name: me.name } : null,
  )
  const { files, addFiles, removeFile, clearFiles } = useAttachmentUpload()

  const replyingTo = useUiStore((s) => s.replyingTo)
  const editingMessage = useUiStore((s) => s.editingMessage)
  const setReplyingTo = useUiStore((s) => s.setReplyingTo)
  const setEditingMessage = useUiStore((s) => s.setEditingMessage)

  const [draft, setDraft] = React.useState('')
  const [fileBusy, setFileBusy] = React.useState(false)

  React.useEffect(() => {
    if (editingMessage) {
      setDraft(editingMessage.body ?? '')
    }
  }, [editingMessage])

  const onSend = React.useCallback(async () => {
    const text = draft.trim()
    if (!conversationUuid) return
    if (!text && files.length === 0) return

    if (editingMessage) {
      try {
        await editMessage(editingMessage.uuid, text)
        setEditingMessage(null)
        setDraft('')
      } catch {
        showError('Failed to edit')
      }
      return
    }

    if (files.length > 0) {
      try {
        setFileBusy(true)
        const sent = await sendMessageWithAttachments(
          conversationUuid,
          text || null,
          files,
          replyingTo?.uuid ?? null,
        )
        clearFiles()
        setDraft('')
        setReplyingTo(null)
        appendOrMergeMessageInCache(queryClient, conversationUuid, sent)
        if (me) {
          applyNewMessagePreview(queryClient, conversationUuid, sent, {
            selfUserId: me.id,
            isActiveConversation: true,
          })
        }
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations })
      } catch {
        showError('Failed to send with attachments')
      } finally {
        setFileBusy(false)
      }
      return
    }

    await sendMessage(
      text,
      undefined,
      replyingTo?.uuid ?? null,
      replyingTo,
    )
    setDraft('')
    setReplyingTo(null)
  }, [
    draft,
    files,
    conversationUuid,
    editingMessage,
    editMessage,
    setEditingMessage,
    clearFiles,
    replyingTo,
    setReplyingTo,
    sendMessage,
    queryClient,
    me,
  ])

  const onDelete = React.useCallback(
    async (m: Message) => {
      const confirmed = await alert.confirmDelete('this message')
      if (!confirmed) return
      try {
        await deleteMessage(m.uuid)
        alert.crud.deleted('Message')
      } catch {
        showError('Failed to delete')
      }
    },
    [deleteMessage],
  )

  if (!conversationUuid) {
    return (
      <div className="flex flex-1 items-center justify-center text-chat-meta">
        Select a conversation
      </div>
    )
  }

  if (convLoading || !conversation) {
    return (
      <div className="flex flex-1 items-center justify-center text-chat-meta">
        Loading…
      </div>
    )
  }

  return (
    <ChatErrorBoundary>
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-chat-surface">
        <ChatHeader
          conversation={conversation}
          selfUserId={selfId}
          onOpenSidebar={onOpenSidebar}
        />
        {inf.isLoading && pages.length === 0 ? (
          <div className="flex min-h-0 flex-1 items-center justify-center text-chat-meta">
            Loading messages…
          </div>
        ) : (
          <InfiniteMessageList
            key={conversationUuid}
            pages={pages}
            hasNextPage={Boolean(inf.hasNextPage)}
            isFetchingNextPage={inf.isFetchingNextPage}
            fetchNextPage={() => void inf.fetchNextPage()}
            selfUserId={selfId}
            peerIsOnline={peerIsOnline}
            peerAvatar={peerAvatarUrl}
            onReply={(m) => setReplyingTo(m)}
            onEdit={(m) => setEditingMessage(m)}
            onDelete={onDelete}
            onMarkPeerMessageRead={markAsRead}
          />
        )}
        <div className="shrink-0">
          <TypingIndicator users={typingUsers} />
          <MessageInput
            value={draft}
            onChange={setDraft}
            onSend={() => void onSend()}
            disabled={isSending || fileBusy}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            editingMessage={editingMessage}
            onCancelEdit={() => {
              setEditingMessage(null)
              setDraft('')
            }}
            onTyping={signalTyping}
            onFiles={(list) => list && addFiles(list)}
            pendingFiles={files}
            onRemoveFile={removeFile}
          />
        </div>
      </section>
    </ChatErrorBoundary>
  )
}
