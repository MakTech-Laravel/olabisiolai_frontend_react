import type { MessagesPage } from '@/features/messaging/types'
import type { Message } from '@/types/message'

/** Oldest → newest for top-to-bottom chat layout. */
export function flattenMessagesChronological(pages: MessagesPage[]): Message[] {
  const out: Message[] = []
  const seen = new Set<string>()
  for (let i = pages.length - 1; i >= 0; i--) {
    const p = pages[i]
    const chronological = [...p.messages].reverse()
    for (const msg of chronological) {
      if (seen.has(msg.uuid)) continue
      seen.add(msg.uuid)
      out.push(msg)
    }
  }
  return out
}
