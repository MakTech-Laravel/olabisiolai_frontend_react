import type { TypingUser } from '@/types/message'
import { cn } from '@/lib/utils'

export function TypingIndicator({ users }: { users: TypingUser[] }) {
  const typing = users.filter((u) => u.is_typing)
  if (typing.length === 0) return null

  let label: string
  if (typing.length === 1) {
    label = `${typing[0].user_name} is typing`
  } else if (typing.length === 2) {
    label = `${typing[0].user_name} and ${typing[1].user_name} are typing`
  } else {
    label = `${typing[0].user_name} and ${typing.length - 1} others are typing`
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 text-xs text-chat-meta">
      <span className="flex gap-0.5" aria-hidden>
        <span className="inline-block size-1 animate-bounce rounded-full bg-chat-meta [animation-delay:-0.2s]" />
        <span className="inline-block size-1 animate-bounce rounded-full bg-chat-meta [animation-delay:-0.1s]" />
        <span className="inline-block size-1 animate-bounce rounded-full bg-chat-meta" />
      </span>
      <span className={cn('italic')}>{label}…</span>
    </div>
  )
}
