import * as React from 'react'

import { BusinessProfileLink } from '@/components/business/BusinessProfileLink'
import { OnlineStatus } from '@/components/chat/OnlineStatus'
import { Avatar } from '@/components/ui/Avatar'
import { UnreadCountBadge } from '@/components/chat/UnreadCountBadge'
import type { Conversation } from '@/types/conversation'
import { conversationPeerAvatar, getConversationPreviewText, getConversationPreviewTime, getConversationTitle } from '@/utils/messageUtils'
import { formatRelative } from '@/utils/formatters'
import { cn } from '@/lib/utils'
import { messagingUserFromParticipant } from '@/types/conversation'
import type { TypingUser } from '@/types/message'

interface ConversationItemProps {
  conversation: Conversation
  selfUserId: number
  isActive: boolean
  typingUsers: TypingUser[]
  onClick: () => void
}

export const ConversationItem = React.memo(function ConversationItem({
  conversation,
  selfUserId,
  isActive,
  typingUsers,
  onClick,
}: ConversationItemProps) {
  const title = getConversationTitle(conversation, selfUserId)
  const peerBusinessId =
    conversation.peer?.business_info_id != null &&
      conversation.peer.business_info_id > 0
      ? conversation.peer.business_info_id
      : null
  const peer =
    conversation.type === 'direct'
      ? conversation.participants.find((p) => p.user_id !== selfUserId)
      : undefined
  const mu = messagingUserFromParticipant(peer)
  const avatarUrl = conversationPeerAvatar(conversation, selfUserId) ?? mu?.avatar ?? null
  const typing = typingUsers.filter((t) => t.is_typing)
  const previewText = getConversationPreviewText(conversation)
  const preview =
    typing.length > 0
      ? `${typing[0].user_name} is typing…`
      : previewText.length > 40
        ? `${previewText.slice(0, 40)}…`
        : previewText

  const timeSrc = getConversationPreviewTime(conversation)

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 border-b border-border-light px-4 py-3.5 text-left transition-colors',
        isActive
          ? 'border-l-4 border-l-chat-accent bg-chat-input-bg'
          : 'border-l-4 border-l-transparent bg-white active:bg-auth-bg',
        conversation.unread_count > 0 && !isActive && 'bg-white',
      )}
    >
      <div className="relative shrink-0">
        <Avatar src={avatarUrl} name={title} className="size-[50px] rounded-full" />
        {mu?.status === 'online' ? (
          <OnlineStatus status="online" size="lg" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('truncate text-[15px] text-ink', conversation.unread_count > 0 ? 'font-bold' : 'font-semibold')}>
            {peerBusinessId !== null ? (
              <BusinessProfileLink
                businessId={peerBusinessId}
                businessName={title}
                className="truncate text-base font-bold text-ink"
              />
            ) : (
              title
            )}
          </p>
          <span
            className={cn(
              'shrink-0 text-[12px]',
              conversation.unread_count > 0 ? 'font-semibold text-chat-meta' : 'text-chat-meta',
            )}
          >
            {formatRelative(timeSrc)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className={cn(
              'min-w-0 flex-1 truncate text-[13.5px]',
              conversation.unread_count > 0 ? 'font-medium text-ink' : 'text-chat-meta',
            )}
          >
            {preview}
          </p>
          {conversation.unread_count > 0 ? (
            <UnreadCountBadge>
              {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
            </UnreadCountBadge>
          ) : null}
        </div>
      </div>
    </button>
  )
})
