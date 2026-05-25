import * as React from 'react'

import { cn } from '@/lib/utils'

const EMOJIS = [
  '😀',
  '😂',
  '🥰',
  '😍',
  '🤔',
  '👍',
  '👏',
  '🙏',
  '🔥',
  '✨',
  '💯',
  '🎉',
  '❤️',
  '⭐',
  '✅',
  '📌',
  '💼',
  '🏠',
  '☕',
  '📅',
  '✉️',
  '📎',
  '📷',
  '🎵',
]

interface EmojiPickerProps {
  open: boolean
  onClose: () => void
  onPick: (emoji: string) => void
  anchorRef: React.RefObject<HTMLElement | null>
}

export function EmojiPicker({ open, onClose, onPick, anchorRef }: EmojiPickerProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (rootRef.current?.contains(t)) return
      if (anchorRef.current?.contains(t)) return
      onClose()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, onClose, anchorRef])

  if (!open) return null

  return (
    <div
      ref={rootRef}
      className={cn(
        'absolute bottom-full right-0 z-50 mb-2 w-64 rounded-2xl border border-chat-border bg-card p-3 shadow-lg',
      )}
    >
      <div className="grid grid-cols-6 gap-1">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            className="rounded-lg p-2 text-xl hover:bg-muted"
            onClick={() => {
              onPick(e)
              onClose()
            }}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}
