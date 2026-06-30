import * as React from 'react'
import { Loader2, Store, X } from 'lucide-react'

import type { CatalogMessagePayload } from '@/features/catalog/catalogMessageContext'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { cn } from '@/lib/utils'

type CatalogComposerPreviewProps = {
  catalog: CatalogMessagePayload
  imageFile?: File | null
  imageLoading?: boolean
  onDismiss: () => void
  className?: string
}

/** Catalog enquiry preview above the message composer (WhatsApp-style). */
export function CatalogComposerPreview({
  catalog,
  imageFile = null,
  imageLoading = false,
  onDismiss,
  className,
}: CatalogComposerPreviewProps) {
  const { businessName, item } = catalog
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!imageFile) {
      setObjectUrl(null)
      return
    }
    const url = URL.createObjectURL(imageFile)
    setObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  const previewSrc = objectUrl ?? (item.imageUrl ? resolveMediaUrl(item.imageUrl, '') : null)
  const showImage = Boolean(previewSrc)
  const showSpinner = imageLoading && !showImage

  return (
    <div
      className={cn(
        'border-t border-chat-border bg-[#eef2f7] px-3 py-2.5 sm:px-4 sm:py-3',
        className,
      )}
    >
      <div className="flex items-stretch gap-2.5 sm:gap-3">
        <div className="w-1 shrink-0 rounded-full bg-chat-accent" aria-hidden />

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="min-w-0 flex-1 py-0.5">
            <p className="truncate text-[13px] font-semibold leading-tight text-chat-accent">
              {businessName}
            </p>
            <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm font-semibold leading-snug text-ink">
              <Store className="size-3.5 shrink-0 text-stat-muted" aria-hidden />
              <span className="truncate">{item.name}</span>
            </p>
            <p className="mt-0.5 text-xs font-medium text-stat-muted">{item.priceDisplay}</p>
          </div>

          <div className="relative shrink-0">
            <div
              className={cn(
                'relative size-14 overflow-hidden rounded-lg border border-white/80 bg-white shadow-sm sm:size-16',
              )}
            >
              {showSpinner ? (
                <div className="grid size-full place-items-center bg-muted/50">
                  <Loader2 className="size-5 animate-spin text-chat-accent" aria-hidden />
                  <span className="sr-only">Loading catalog image…</span>
                </div>
              ) : showImage ? (
                <>
                  <img src={previewSrc!} alt={item.name} className="size-full object-cover" />
                  {imageLoading ? (
                    <div className="absolute inset-0 grid place-items-center bg-black/25">
                      <Loader2 className="size-4 animate-spin text-white" aria-hidden />
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="grid size-full place-items-center bg-muted/40 px-1 text-center text-[9px] font-bold uppercase tracking-wide text-stat-muted">
                  {item.type}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            aria-label="Remove catalog enquiry"
            onClick={onDismiss}
            className="grid size-8 shrink-0 place-items-center self-start rounded-full border border-border-light bg-white text-stat-muted shadow-sm transition-colors hover:bg-muted hover:text-ink"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
