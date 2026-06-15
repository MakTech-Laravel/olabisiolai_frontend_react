import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ProfileHubSlidePanelProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
}

/** Full-screen slide-over from the right (manage business). */
export function ProfileHubSlidePanel({ open, onClose, children }: ProfileHubSlidePanelProps) {
  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-50 bg-[rgba(8,12,18,0.42)] transition-opacity duration-200',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed inset-0 z-[60] flex flex-col bg-auth-bg transition-transform duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)]',
          'lg:inset-y-0 lg:left-auto lg:w-full lg:max-w-[520px] lg:shadow-2xl',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="mx-auto flex h-full w-full max-w-[430px] flex-col lg:max-w-none">{children}</div>
      </div>
    </>
  )
}
