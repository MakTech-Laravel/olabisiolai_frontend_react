import { CheckCheck, Clock } from 'lucide-react'

import type { MessageStatus } from '@/types/message'

export function MessageStatusIcon({
  status,
  isOwn,
}: {
  status: MessageStatus
  isOwn: boolean
}) {
  if (!isOwn) return null
  if (status === 'sending') {
    return <Clock className="size-3.5 text-chat-meta" aria-hidden />
  }
  if (status === 'seen') {
    return <CheckCheck className="size-3.5 text-sky-500" aria-label="Seen" />
  }
  return <CheckCheck className="size-3.5 text-chat-meta" aria-label="Delivered" />
}
