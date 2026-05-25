import type { Message } from '@/types/message'

export function ReadReceipt({ message }: { message: Message }) {
  const n = message.read_by?.length ?? message.reads.length
  if (n === 0) return null
  return (
    <span className="text-[10px] text-chat-meta" aria-label={`Read by ${n}`}>
      Read
    </span>
  )
}
