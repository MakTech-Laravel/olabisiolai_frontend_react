import { X } from 'lucide-react'
import { useEffect } from 'react'

import { BUSINESS_PROVIDES_TOTAL_PRICE } from '@/features/catalog/cartPricing'
import type { CartMessagePayload } from '@/features/catalog/cartMessageContext'
import { cn } from '@/lib/utils'

type SentCartSummarySheetProps = {
  open: boolean
  cart: CartMessagePayload
  onClose: () => void
}

function formatSentAt(iso: string): string {
  try {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return ''
  }
}

/** Dark WhatsApp-style summary of a cart already sent in chat. */
export function SentCartSummarySheet({ open, cart, onClose }: SentCartSummarySheetProps) {
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

  const count = cart.itemCount || cart.items.reduce((sum, item) => sum + item.qty, 0)
  const sentLabel = formatSentAt(cart.sentAt)

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sent-cart-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/55"
        aria-label="Close sent cart"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 flex max-h-[88dvh] w-full max-w-md flex-col overflow-hidden',
          'rounded-t-2xl bg-[#0b141a] text-[#e9edef] shadow-2xl',
          'sm:rounded-2xl',
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
          <div className="min-w-0">
            <h2 id="sent-cart-title" className="truncate text-base font-semibold">
              Sent cart
            </h2>
            <p className="truncate text-xs text-[#8696a0]">
              {cart.businessName}
              {sentLabel ? ` · ${sentLabel}` : ''}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-full text-[#8696a0] transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <p className="mb-3 text-sm text-[#8696a0]">
            {count} item{count === 1 ? '' : 's'}
          </p>
          <ul className="space-y-3">
            {cart.items.map((item) => (
              <li key={`${item.id}-${item.name}`} className="flex gap-3">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="size-12 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-[#202c33] text-[10px] font-bold uppercase text-[#8696a0]">
                    Item
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#e9edef]">{item.name}</p>
                      <p className="mt-0.5 text-xs text-[#8696a0]">Qty {item.qty}</p>
                    </div>
                    {item.lineTotalDisplay ? (
                      item.hasDiscount && item.originalLineTotalDisplay ? (
                        <span className="inline-flex shrink-0 flex-col items-end gap-0.5 text-right">
                          <span className="text-sm font-semibold tabular-nums text-[#e9edef]">
                            {item.lineTotalDisplay}
                          </span>
                          <span className="text-[11px] tabular-nums text-[#8696a0] line-through">
                            {item.originalLineTotalDisplay}
                          </span>
                        </span>
                      ) : (
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-[#e9edef]">
                          {item.lineTotalDisplay}
                        </span>
                      )
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-white/10 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0))]">
          {cart.estimatedTotalDisplay === BUSINESS_PROVIDES_TOTAL_PRICE ||
          cart.items.every((item) => !item.lineTotalDisplay) ? (
            <p className="text-base font-semibold text-[#e9edef]">
              {BUSINESS_PROVIDES_TOTAL_PRICE}
            </p>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[#8696a0]">Estimated total</span>
              <span className="text-base font-semibold text-[#e9edef]">
                {cart.estimatedTotalDisplay}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
