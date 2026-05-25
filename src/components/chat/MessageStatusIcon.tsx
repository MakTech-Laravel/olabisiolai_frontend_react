import { Check, CheckCheck, Clock } from 'lucide-react'

import type { MessageStatus } from '@/types/message'
import { cn } from '@/lib/utils'

type MessageStatusIconProps = {
  status: MessageStatus
  isOwn: boolean
  /** When true, `sent` is shown as double gray (delivered) until read. */
  peerIsOnline?: boolean
}

/**
 * Own-message ticks (WhatsApp-style):
 * - sending: clock
 * - sent (peer offline): single gray tick
 * - delivered (peer online, not read): double gray ticks
 * - seen: double blue ticks
 */
export function MessageStatusIcon({
  status,
  isOwn,
  peerIsOnline = false,
}: MessageStatusIconProps) {
  if (!isOwn) return null

  const iconClass = 'size-3.5 shrink-0'

  if (status === 'sending') {
    return (
      <Clock
        className={cn(iconClass, 'text-chat-meta')}
        aria-label="Sending"
      />
    )
  }

  if (status === 'seen') {
    return (
      <CheckCheck
        className={cn(iconClass, 'text-sky-500')}
        aria-label="Read"
      />
    )
  }

  if (status === 'delivered' || (status === 'sent' && peerIsOnline)) {
    return (
      <CheckCheck
        className={cn(iconClass, 'text-chat-meta')}
        aria-label="Delivered"
      />
    )
  }

  return (
    <Check
      className={cn(iconClass, 'text-chat-meta')}
      aria-label="Sent"
    />
  )
}
