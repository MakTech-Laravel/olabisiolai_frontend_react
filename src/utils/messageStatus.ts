import type { Message, MessageStatus } from '@/types/message'

/** Peer is considered active for delivery ticks when presence is online. */
export function isPeerOnline(
  presenceStatus: string | null | undefined,
): boolean {
  return presenceStatus === 'online'
}

/** Display status for own messages (maps sent+online → delivered visually). */
export function resolveOwnMessageDisplayStatus(
  message: Message,
  peerIsOnline: boolean,
): MessageStatus {
  if (message.status === 'seen') return 'seen'
  if (message.status === 'delivered') return 'delivered'
  if (message.status === 'sent' && peerIsOnline) return 'delivered'
  return message.status
}
