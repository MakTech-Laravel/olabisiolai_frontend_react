import { ShoppingBag } from 'lucide-react'

import { cn } from '@/lib/utils'

type VendorCatalogCartBarProps = {
  itemCount: number
  estimatedTotalDisplay: string
  onReview: () => void
  className?: string
}

export function VendorCatalogCartBar({
  itemCount,
  estimatedTotalDisplay,
  onReview,
  className,
}: VendorCatalogCartBarProps) {
  if (itemCount <= 0) return null

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-border-light bg-white/95 px-4 py-3 backdrop-blur-md',
        'pb-[max(0.75rem,env(safe-area-inset-bottom,0))]',
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">
            {itemCount} item{itemCount === 1 ? '' : 's'} · {estimatedTotalDisplay}
          </p>
          <p className="text-xs text-stat-muted">Estimated total</p>
        </div>
        <button
          type="button"
          onClick={onReview}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#273449]"
        >
          <ShoppingBag className="size-4" aria-hidden />
          Review / Send
        </button>
      </div>
    </div>
  )
}
