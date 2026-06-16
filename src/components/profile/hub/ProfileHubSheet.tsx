import type { ReactNode } from 'react'

type ProfileHubSheetProps = {
  open: boolean
  title?: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
}

/** Bottom sheet for switcher and auxiliary panels. */
export function ProfileHubSheet({ open, title, subtitle, onClose, children }: ProfileHubSheetProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center lg:items-center lg:p-6"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-[rgba(8,12,18,0.42)]"
        aria-label="Close panel"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[88dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[24px] bg-white px-[18px] pb-[calc(20px+env(safe-area-inset-bottom))] pt-2.5 shadow-xl lg:max-h-[min(85dvh,720px)] lg:max-w-xl lg:rounded-2xl lg:pb-5">
        <div className="mx-auto mb-3.5 h-1 w-10 shrink-0 rounded-full bg-[#dde2ea] lg:hidden" aria-hidden />
        {title ? <h2 className="font-heading text-[19px] font-bold text-ink">{title}</h2> : null}
        {subtitle ? <p className="mt-1 mb-4 text-[13.5px] leading-relaxed text-body-secondary">{subtitle}</p> : null}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
