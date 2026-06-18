import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'

type VendorOwnerModalShellProps = {
  title: string
  open: boolean
  loading?: boolean
  saveLabel?: string
  onClose: () => void
  onSave: () => void
  children: ReactNode
  saveDisabled?: boolean
}

export function VendorOwnerModalShell({
  title,
  open,
  loading = false,
  saveLabel = 'Save',
  onClose,
  onSave,
  children,
  saveDisabled = false,
}: VendorOwnerModalShellProps) {
  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="owner-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[min(88dvh,calc(100dvh-env(safe-area-inset-bottom)))] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-card shadow-xl sm:max-h-[90dvh] sm:rounded-2xl">
        <div className="mx-auto mb-1 mt-2 h-1 w-10 shrink-0 rounded-full bg-border-light sm:hidden" aria-hidden />

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border-light px-5 py-3 sm:py-4">
          <h2 id="owner-modal-title" className="text-lg font-semibold text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-full hover:bg-surface-soft"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 [-webkit-overflow-scrolling:touch]">
          {children}
        </div>

        <div className="shrink-0 border-t border-border-light bg-card px-5 py-3 shadow-[0_-6px_16px_rgba(16,22,32,0.08)] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:py-4 sm:pb-4">
          <div className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-8 md w-full sm:w-auto"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-8 md w-full sm:w-auto"
              onClick={onSave}
              disabled={loading || saveDisabled}
            >
              {loading ? 'Saving…' : saveLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
