import { Minus, Plus, ShoppingBag, X } from 'lucide-react'
import { useEffect } from 'react'

import { BUSINESS_PROVIDES_TOTAL_PRICE } from '@/features/catalog/cartPricing'
import type { VendorCart } from '@/features/catalog/vendorCart'
import { cn } from '@/lib/utils'

type VendorCartReviewSheetProps = {
  open: boolean
  cart: VendorCart
  estimatedTotalDisplay: string
  itemCount: number
  sending?: boolean
  onClose: () => void
  onSend: () => void
  onSetQty: (catalogItemId: number, qty: number) => void
}

/** Buyer review sheet before sending cart to the vendor. */
export function VendorCartReviewSheet({
  open,
  cart,
  estimatedTotalDisplay,
  itemCount,
  sending = false,
  onClose,
  onSend,
  onSetQty,
}: VendorCartReviewSheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vendor-cart-review-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-[rgba(8,12,18,0.45)]"
        aria-label="Close cart"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border-light px-4 py-3.5">
          <div className="min-w-0">
            <h2 id="vendor-cart-review-title" className="truncate font-heading text-lg font-bold text-ink">
              Your cart
            </h2>
            <p className="truncate text-xs text-stat-muted">
              {cart.businessName} · {itemCount} item{itemCount === 1 ? '' : 's'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-full text-stat-muted transition-colors hover:bg-auth-bg hover:text-ink"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <ul className="space-y-3">
            {cart.items.map((line) => (
              <li key={line.catalogItemId} className="flex gap-3">
                {line.imageUrl ? (
                  <img
                    src={line.imageUrl}
                    alt=""
                    className="size-14 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-muted text-stat-muted">
                    <ShoppingBag className="size-5" aria-hidden />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-ink">{line.name}</p>
                    {!line.priceFrom && line.unitPriceKobo !== null && line.priceDisplay ? (
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                        {line.priceDisplay}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-border-light bg-auth-bg p-0.5">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      disabled={sending}
                      onClick={() => onSetQty(line.catalogItemId, line.qty - 1)}
                      className="grid size-7 place-items-center rounded-full text-ink transition-colors hover:bg-white disabled:opacity-50"
                    >
                      <Minus className="size-3.5" aria-hidden />
                    </button>
                    <span className="min-w-6 text-center text-sm font-semibold tabular-nums">
                      {line.qty}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={sending}
                      onClick={() => onSetQty(line.catalogItemId, line.qty + 1)}
                      className="grid size-7 place-items-center rounded-full text-ink transition-colors hover:bg-white disabled:opacity-50"
                    >
                      <Plus className="size-3.5" aria-hidden />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-border-light px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0))]">
          <div className="mb-3">
            {estimatedTotalDisplay === BUSINESS_PROVIDES_TOTAL_PRICE ||
            cart.items.some((line) => line.priceFrom || line.unitPriceKobo === null) ? (
              <p className="font-heading text-base font-bold text-ink">
                {BUSINESS_PROVIDES_TOTAL_PRICE}
              </p>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-stat-muted">Estimated total</span>
                <span className="font-heading text-base font-bold text-ink">{estimatedTotalDisplay}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            disabled={sending || cart.items.length === 0}
            onClick={onSend}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3.5 text-[15px] font-semibold text-white',
              'transition-opacity disabled:opacity-60',
            )}
          >
            {sending ? 'Sending…' : 'Send cart'}
          </button>
        </div>
      </div>
    </div>
  )
}
