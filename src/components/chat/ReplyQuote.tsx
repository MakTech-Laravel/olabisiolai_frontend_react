import type { Message } from '@/types/message'
import { cn } from '@/lib/utils'
import { getMessagePreviewText } from '@/utils/messageUtils'

interface ReplyQuoteProps {
  parent: Message
  isOwn: boolean
  onScrollToParent: (uuid: string) => void
}

export function ReplyQuote({ parent, isOwn, onScrollToParent }: ReplyQuoteProps) {
  const preview = getMessagePreviewText(parent)

  return (
    <button
      type="button"
      onClick={() => onScrollToParent(parent.uuid)}
      className={cn(
        'mb-2 w-full rounded-md border-l-2 py-0.5 pl-2 text-left text-xs transition-opacity hover:opacity-100',
        isOwn
          ? 'border-white/70 opacity-90'
          : 'border-chat-accent opacity-90',
      )}
    >
      <span className="block truncate font-semibold">{parent.sender.name}</span>
      <span className="line-clamp-2 opacity-80">{preview}</span>
    </button>
  )
}
