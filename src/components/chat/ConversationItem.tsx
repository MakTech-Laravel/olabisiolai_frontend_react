import * as React from 'react'

import { MessagingPeerLink } from '@/components/messaging/MessagingPeerLink'
import { OnlineStatus } from '@/components/chat/OnlineStatus'
import { Avatar } from '@/components/ui/Avatar'
import { UnreadCountBadge } from '@/components/chat/UnreadCountBadge'
import type { Conversation } from '@/types/conversation'
import { conversationPeerAvatar, getConversationPreviewText, getConversationPreviewTime, getConversationTitle } from '@/utils/messageUtils'
import { formatRelative } from '@/utils/formatters'
import { cn } from '@/lib/utils'
import { messagingUserFromParticipant } from '@/types/conversation'
import { peerDisplayName } from '@/lib/messagingPeer'
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
  const peer = conversation.peer ?? null
  const peerParticipant =
    conversation.type === 'direct'
      ? conversation.participants.find((p) => p.user_id !== selfUserId)
      : undefined
  const mu = messagingUserFromParticipant(peerParticipant)
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
  const listTitle =
    conversation.type === 'direct' && peer ? peerDisplayName(peer) : title

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-colors',
        isActive
          ? 'border-l-4 border-chat-accent bg-card shadow-sm'
          : 'border-l-4 border-transparent hover:bg-card/60',
      )}
    >
      <div className="relative shrink-0">
        <Avatar src={avatarUrl} name={listTitle} className="size-12 rounded-xl" />
        {mu?.status === 'online' ? (
          <OnlineStatus status="online" size="lg" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-base font-bold text-ink">
            {conversation.type === 'direct' && peer ? (
              <MessagingPeerLink peer={peer} className="truncate text-base font-bold text-ink" />
            ) : (
              title
            )}
          </p>
          <span
            className={cn(
              'shrink-0 text-[10px]',
              isActive ? 'font-semibold uppercase text-chat-accent' : 'text-chat-meta',
            )}
          >
            {formatRelative(timeSrc)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-chat-meta">{preview}</p>
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
