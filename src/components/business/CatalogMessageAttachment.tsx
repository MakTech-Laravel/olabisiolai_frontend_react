import { Store, X } from 'lucide-react'

import type { CatalogMessagePayload } from '@/features/catalog/catalogMessageContext'
import { cn } from '@/lib/utils'

type CatalogMessageAttachmentProps = {
  catalog: CatalogMessagePayload
  onDismiss: () => void
  className?: string
}

/** WhatsApp-style catalog preview bar above the message composer. */
export function CatalogMessageAttachment({
  catalog,
  onDismiss,
  className,
}: CatalogMessageAttachmentProps) {
  const { businessName, item } = catalog

  return (
    <div
      className={cn(
        'flex items-stretch gap-3 border-t border-white/10 bg-[#0b141a] px-3 py-2.5 text-white sm:px-4',
        className,
      )}
    >
      <div className="w-1 shrink-0 rounded-full bg-[#53bdeb]" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-0.5">
        <p className="truncate text-[13px] font-semibold text-[#53bdeb]">{businessName}</p>
        <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-white">
          <Store className="size-3.5 shrink-0 text-white/80" aria-hidden />
          <span className="truncate">{item.name}</span>
        </p>
      </div>
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt=""
          className="size-11 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="grid size-11 shrink-0 place-items-center rounded-md bg-white/10 text-[10px] font-bold uppercase text-white/70">
          {item.type}
        </div>
      )}
      <button
        type="button"
        aria-label="Remove catalog attachment"
        onClick={onDismiss}
        className="grid size-8 shrink-0 place-items-center self-center rounded-full border border-white/30 text-white/90 transition-colors hover:bg-white/10"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  )
}
