import { Menu, MessageCircle } from 'lucide-react'

import { MessagingPeerLink } from '@/components/messaging/MessagingPeerLink'
import { OnlineStatus } from '@/components/chat/OnlineStatus'
import { Avatar } from '@/components/ui/Avatar'
import type { Conversation } from '@/types/conversation'
import { conversationPeerAvatar, getConversationTitle } from '@/utils/messageUtils'
import { formatLastSeen } from '@/utils/formatters'
import { cn } from '@/lib/utils'
import { messagingUserFromParticipant } from '@/types/conversation'
import { peerPersonalName } from '@/lib/messagingPeer'
import type { UserStatus } from '@/types/user'

function normalizeUserStatus(value: string | undefined): UserStatus {
  if (value === 'online' || value === 'away') return value
  return 'offline'
}

interface ChatHeaderProps {
  conversation: Conversation
  selfUserId: number
  onOpenSidebar?: () => void
}

export function ChatHeader({
  conversation,
  selfUserId,
  onOpenSidebar,
}: ChatHeaderProps) {
  const title = getConversationTitle(conversation, selfUserId)
  const peer = conversation.peer ?? null
  const peerParticipant =
    conversation.type === 'direct'
      ? conversation.participants.find((p) => p.user_id !== selfUserId)
      : undefined
  const mu = messagingUserFromParticipant(peerParticipant)
  const avatarUrl = conversationPeerAvatar(conversation, selfUserId) ?? mu?.avatar ?? null
  const status = normalizeUserStatus(
    conversation.peer?.presence?.status ?? mu?.status ?? 'offline',
  )
  const lastSeenAt =
    conversation.peer?.presence?.last_seen_at ?? mu?.last_seen_at ?? null
  const subtitle =
    peer?.business_name?.trim() ||
    (peer?.role === 'vendor' ? 'Business owner' : null)

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-chat-border bg-chat-surface-header px-4 backdrop-blur-sm sm:h-20 sm:px-6 md:px-8">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        {onOpenSidebar ? (
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-muted md:hidden"
            aria-label="Open conversations"
            onClick={onOpenSidebar}
          >
            <Menu className="size-5 text-ink" />
          </button>
        ) : null}
        <div className="relative">
          <Avatar
            src={avatarUrl}
            name={peer ? peerPersonalName(peer) : title}
            className="size-9 shrink-0 sm:size-10"
          />
          <OnlineStatus status={status} size="md" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate font-heading text-sm font-extrabold tracking-tight text-ink sm:text-base">
            {conversation.type === 'direct' && peer ? (
              <MessagingPeerLink peer={peer} className="font-heading text-sm font-extrabold tracking-tight sm:text-base" />
            ) : (
              title
            )}
          </h2>
          <div className="mt-0.5 flex min-w-0 items-center gap-2">
            <span
              className={cn(
                'size-2 shrink-0 rounded-full',
                status === 'online' ? 'bg-chat-online-dot' : 'bg-muted-foreground/40',
              )}
            />
            <span className="truncate text-xs font-semibold text-chat-online-text">
              {subtitle ? `${subtitle} · ` : ''}
              {status === 'online'
                ? 'Online'
                : lastSeenAt
                  ? `Last seen ${formatLastSeen(lastSeenAt)}`
                  : 'Offline'}
            </span>
          </div>
        </div>
      </div>
      <MessageCircle className="size-6 shrink-0 text-stat-muted sm:hidden" aria-hidden />
    </header>
  )
}
