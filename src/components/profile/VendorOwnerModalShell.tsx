import type { ReactNode } from 'react'
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
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
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
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
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

        {children}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={onSave} disabled={loading || saveDisabled}>
            {loading ? 'Saving…' : saveLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
