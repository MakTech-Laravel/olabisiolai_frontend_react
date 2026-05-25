import type { ReactNode } from 'react'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

export function MobileDrawer({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute left-0 top-0 flex h-full w-[min(100%,320px)] flex-col bg-chat-input-bg shadow-xl',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-chat-border px-4">
          <span className="font-bold text-ink">{title ?? 'Conversations'}</span>
          <button type="button" className="rounded-lg p-2 hover:bg-muted" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
