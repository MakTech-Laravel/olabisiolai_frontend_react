import { ExternalLink, Store } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { CatalogMessagePayload } from '@/features/catalog/catalogMessageContext'
import { cn } from '@/lib/utils'

type CatalogEnquiryCardProps = {
  catalog: CatalogMessagePayload
  isOwn: boolean
  className?: string
}

export function CatalogEnquiryCard({ catalog, isOwn, className }: CatalogEnquiryCardProps) {
  const { businessName, catalogUrl, item } = catalog
  const catalogPath = catalogUrl.replace(/^https?:\/\/[^/]+/, '')

  return (
    <div
      className={cn(
        'mb-2 overflow-hidden rounded-xl border text-left',
        isOwn
          ? 'border-white/25 bg-white/10'
          : 'border-chat-border bg-white/80',
        className,
      )}
    >
      <div className="flex gap-3 p-2.5">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            className="size-14 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div
            className={cn(
              'grid size-14 shrink-0 place-items-center rounded-lg text-[10px] font-bold uppercase',
              isOwn ? 'bg-white/15 text-white/80' : 'bg-muted text-stat-muted',
            )}
          >
            {item.type}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate text-xs font-semibold',
              isOwn ? 'text-white/90' : 'text-chat-accent',
            )}
          >
            {businessName}
          </p>
          <p
            className={cn(
              'mt-0.5 flex items-center gap-1 text-sm font-semibold',
              isOwn ? 'text-white' : 'text-ink',
            )}
          >
            <Store className="size-3.5 shrink-0 opacity-70" aria-hidden />
            <span className="truncate">{item.name}</span>
          </p>
          <p
            className={cn(
              'mt-0.5 text-xs font-medium',
              isOwn ? 'text-white/80' : 'text-stat-muted',
            )}
          >
            {item.priceDisplay}
          </p>
        </div>
      </div>
      <Link
        to={catalogPath}
        className={cn(
          'flex items-center justify-center gap-1.5 border-t px-3 py-2 text-xs font-semibold transition-colors',
          isOwn
            ? 'border-white/20 text-white/90 hover:bg-white/10'
            : 'border-chat-border text-chat-accent hover:bg-muted/60',
        )}
      >
        View catalog item
        <ExternalLink className="size-3" aria-hidden />
      </Link>
    </div>
  )
}
