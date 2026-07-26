import { Minus, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'

type CatalogAddToCartControlProps = {
  qty: number
  onAdd: () => void
  onSetQty: (qty: number) => void
  className?: string
  size?: 'sm' | 'md'
}

/** Compact + / qty control for premium catalog cards and detail. */
export function CatalogAddToCartControl({
  qty,
  onAdd,
  onSetQty,
  className,
  size = 'sm',
}: CatalogAddToCartControlProps) {
  const buttonSize = size === 'md' ? 'size-10' : 'size-8'
  const iconSize = size === 'md' ? 'size-4' : 'size-3.5'

  if (qty <= 0) {
    return (
      <button
        type="button"
        aria-label="Add to cart"
        onClick={(event) => {
          event.stopPropagation()
          event.preventDefault()
          onAdd()
        }}
        className={cn(
          'grid place-items-center rounded-full bg-ink text-white shadow-md transition-transform hover:scale-105 active:scale-95',
          buttonSize,
          className,
        )}
      >
        <Plus className={iconSize} aria-hidden />
      </button>
    )
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full border border-border-light bg-white/95 p-0.5 shadow-md',
        className,
      )}
      onClick={(event) => {
        event.stopPropagation()
        event.preventDefault()
      }}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={(event) => {
          event.stopPropagation()
          event.preventDefault()
          onSetQty(qty - 1)
        }}
        className={cn('grid place-items-center rounded-full text-ink hover:bg-auth-bg', buttonSize)}
      >
        <Minus className={iconSize} aria-hidden />
      </button>
      <span className="min-w-5 px-0.5 text-center text-xs font-bold tabular-nums text-ink">{qty}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={(event) => {
          event.stopPropagation()
          event.preventDefault()
          onSetQty(qty + 1)
        }}
        className={cn('grid place-items-center rounded-full text-ink hover:bg-auth-bg', buttonSize)}
      >
        <Plus className={iconSize} aria-hidden />
      </button>
    </div>
  )
}
