import { Link } from 'react-router-dom'
import { ChevronLeft, Pencil } from 'lucide-react'

import { cn } from '@/lib/utils'

export type OwnerPageMode = 'edit' | 'preview'

type VendorOwnerEditShellProps = {
  businessName: string
  mode: OwnerPageMode
  onModeChange: (mode: OwnerPageMode) => void
  children: React.ReactNode
}

export function VendorOwnerEditShell({
  businessName,
  mode,
  onModeChange,
  children,
}: VendorOwnerEditShellProps) {
  const isPreview = mode === 'preview'

  return (
    <div className={cn(isPreview && 'owner-preview-mode')}>
      <div className="sticky top-0 z-40 border-b border-border-light bg-white">
        <div className="container mx-auto flex items-center gap-2 px-3.5 py-3">
          <Link
            to="/user/profile"
            className="inline-flex items-center gap-1 text-[15px] font-semibold text-chat-accent"
          >
            <ChevronLeft className="size-5" strokeWidth={2} aria-hidden />
            Done
          </Link>
          <p className="min-w-0 flex-1 truncate text-center font-heading text-[15.5px] font-bold text-ink">
            {businessName || 'Your page'}
          </p>
          <div className="flex rounded-[10px] bg-auth-bg p-0.5" role="group" aria-label="Edit or preview">
            <button
              type="button"
              aria-pressed={!isPreview}
              onClick={() => onModeChange('edit')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors',
                !isPreview ? 'bg-white text-ink shadow-sm' : 'text-body-secondary',
              )}
            >
              Edit
            </button>
            <button
              type="button"
              aria-pressed={isPreview}
              onClick={() => onModeChange('preview')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors',
                isPreview ? 'bg-white text-ink shadow-sm' : 'text-body-secondary',
              )}
            >
              Preview
            </button>
          </div>
        </div>
        {!isPreview ? (
          <div className="flex items-center gap-2 bg-gradient-to-br from-[#FFF7E9] to-[#FDEFD3] px-4 py-2.5 text-[12.5px] font-semibold text-[#7a5a16]">
            <div className="container mx-auto flex items-center gap-2">
              <Pencil className="size-4 shrink-0 text-[#9A6B1F]" strokeWidth={2} aria-hidden />
              Editing mode — tap any pencil to change a section. Switch to Preview to see what customers see.
            </div>
          </div>
        ) : null}
      </div>
      {children}
    </div>
  )
}
