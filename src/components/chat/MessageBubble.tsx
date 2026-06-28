import * as React from 'react'
import { MoreHorizontal, Pencil } from 'lucide-react'

import { AttachmentPreview } from '@/components/chat/AttachmentPreview'
import { CatalogEnquiryCard } from '@/components/chat/CatalogEnquiryCard'
import { MessageStatusIcon } from '@/components/chat/MessageStatusIcon'
import { ReplyQuote } from '@/components/chat/ReplyQuote'
import { Avatar } from '@/components/ui/Avatar'
import { parseCatalogEnquiryBody } from '@/features/catalog/catalogMessageContext'
import type { Message } from '@/types/message'
import { cn } from '@/lib/utils'
import { formatMessageTime } from '@/utils/formatters'
import { resolveOwnMessageDisplayStatus } from '@/utils/messageStatus'

interface MessageBubbleProps {
  message: Message
  parentMessage?: Message | null
  isOwn: boolean
  peerIsOnline?: boolean
  peerAvatar?: string | null
  showAvatar: boolean
  highlighted?: boolean
  onReply: () => void
  onEdit: () => void
  onDelete: () => void
  onScrollToParent: (uuid: string) => void
}

export const MessageBubble = React.memo(function MessageBubble({
  message,
  parentMessage,
  isOwn,
  peerIsOnline = false,
  peerAvatar = null,
  showAvatar,
  highlighted = false,
  onReply,
  onEdit,
  onDelete,
  onScrollToParent,
}: MessageBubbleProps) {
  const [menu, setMenu] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const bubbleRef = React.useRef<HTMLDivElement>(null)

  const replyParent = parentMessage ?? message.parent ?? null
  const catalogEnquiry = parseCatalogEnquiryBody(message.body)
  const displayStatus = isOwn
    ? resolveOwnMessageDisplayStatus(message, peerIsOnline)
    : message.status

  const incomingAvatar = message.sender.avatar ?? peerAvatar ?? null

  React.useEffect(() => {
    if (!menu) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (menuRef.current?.contains(target)) return
      if (bubbleRef.current?.contains(target)) {
        const actionsBtn = (target as HTMLElement).closest(
          '[aria-label="Message actions"]',
        )
        if (actionsBtn) return
      }
      setMenu(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [menu])

  return (
    <div
      ref={bubbleRef}
      className={cn(
        'group flex w-full min-w-0 gap-2 sm:gap-3',
        isOwn ? 'justify-end' : 'justify-start',
        highlighted && 'animate-pulse rounded-lg ring-2 ring-chat-accent/60',
      )}
      data-message-uuid={message.uuid}
    >
      {!isOwn && showAvatar ? (
        <Avatar
          src={incomingAvatar}
          name={message.sender.name}
          className="mt-1 size-8 shrink-0 rounded-full"
        />
      ) : !isOwn ? (
        <div className="size-8 shrink-0" aria-hidden />
      ) : null}
      <div
        className={cn(
          'flex min-w-0 max-w-[88%] flex-col sm:max-w-md md:max-w-lg lg:max-w-xl',
          isOwn ? 'ml-auto items-end' : 'mr-auto items-start',
        )}
      >
        <div
          className={cn(
            'max-w-full rounded-2xl p-2 shadow-sm sm:p-3',
            isOwn
              ? 'rounded-br-md bg-chat-accent text-text-white sm:rounded-br-2xl'
              : 'rounded-bl-md bg-chat-bubble-them text-ink sm:rounded-bl-2xl',
            message._isOptimistic && 'opacity-70',
            message._failed && 'ring-2 ring-destructive',
          )}
          onContextMenu={(e) => {
            e.preventDefault()
            setMenu(true)
          }}
        >
          {replyParent ? (
            <ReplyQuote
              parent={replyParent}
              isOwn={isOwn}
              onScrollToParent={onScrollToParent}
            />
          ) : null}
          {catalogEnquiry?.userText ? (
            <p className="break-words whitespace-pre-wrap text-sm leading-5 [overflow-wrap:anywhere]">
              {catalogEnquiry.userText}
            </p>
          ) : message.body && !catalogEnquiry ? (
            <p className="break-words whitespace-pre-wrap text-sm leading-5 [overflow-wrap:anywhere]">
              {message.body}
            </p>
          ) : null}
          <AttachmentPreview items={message.attachments} />
          {catalogEnquiry && !(message.attachments?.length ?? 0) ? (
            <CatalogEnquiryCard catalog={catalogEnquiry.catalog} isOwn={isOwn} />
          ) : null}
          {message.edited_at ? (
            <p
              className={cn(
                'mt-1 flex items-center gap-1 text-[10px] opacity-80',
                isOwn ? 'justify-end' : '',
              )}
            >
              <Pencil className="size-3" aria-hidden />
              edited
            </p>
          ) : null}
        </div>
        <div
          className={cn(
            'mt-1 flex items-center gap-1.5 text-[11px] text-chat-meta',
            isOwn ? 'justify-end pr-0.5' : 'pl-1',
          )}
        >
          <span>{formatMessageTime(message.created_at)}</span>
          <MessageStatusIcon
            status={displayStatus}
            isOwn={isOwn}
            peerIsOnline={peerIsOnline}
          />
          <button
            type="button"
            className="rounded p-0.5 opacity-0 hover:bg-muted group-hover:opacity-100"
            aria-label="Message actions"
            onClick={() => setMenu((v) => !v)}
          >
            <MoreHorizontal className="size-4" />
          </button>
        </div>
        {menu ? (
          <div
            ref={menuRef}
            className={cn(
              'mt-1 flex gap-2 rounded-lg border border-chat-border bg-card p-2 text-xs shadow-md',
              isOwn ? 'justify-end' : '',
            )}
          >
            <button
              type="button"
              className="hover:underline"
              onClick={() => {
                onReply()
                setMenu(false)
              }}
            >
              Reply
            </button>
            {isOwn ? (
              <button
                type="button"
                className="hover:underline"
                onClick={() => {
                  onEdit()
                  setMenu(false)
                }}
              >
                Edit
              </button>
            ) : null}
            {isOwn ? (
              <button
                type="button"
                className="text-destructive hover:underline"
                onClick={() => {
                  onDelete()
                  setMenu(false)
                }}
              >
                Delete
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
})
