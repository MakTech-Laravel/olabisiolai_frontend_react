import { ShoppingBag } from 'lucide-react'
import { useState } from 'react'

import { SentCartSummarySheet } from '@/components/chat/SentCartSummarySheet'
import { fetchSentBuyerCart } from '@/features/catalog/buyerCartApi'
import { BUSINESS_PROVIDES_TOTAL_PRICE } from '@/features/catalog/cartPricing'
import {
  buildCartMessagePayloadFromBuyerCart,
  type CartMessagePayload,
} from '@/features/catalog/cartMessageContext'
import { getLaravelErrorMessage } from '@/lib/laravelApiError'
import { cn } from '@/lib/utils'

type CatalogCartCardProps = {
  cart: CartMessagePayload
  isOwn: boolean
  className?: string
}

export function CatalogCartCard({ cart, isOwn, className }: CatalogCartCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetCart, setSheetCart] = useState<CartMessagePayload>(cart)
  const [loading, setLoading] = useState(false)
  const count = cart.itemCount || cart.items.reduce((sum, item) => sum + item.qty, 0)
  const thumb = cart.items.find((item) => item.imageUrl)?.imageUrl ?? null

  const openSheet = () => {
    setSheetCart(cart)
    setSheetOpen(true)
    if (!cart.cartId) return

    void (async () => {
      setLoading(true)
      try {
        const fresh = await fetchSentBuyerCart(cart.cartId!)
        setSheetCart(buildCartMessagePayloadFromBuyerCart(fresh))
      } catch (error) {
        // Keep embedded payload if API fetch fails (legacy messages).
        if (import.meta.env.DEV) {
          console.warn(getLaravelErrorMessage(error, 'Could not refresh sent cart'))
        }
      } finally {
        setLoading(false)
      }
    })()
  }

  return (
    <>
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
          {thumb ? (
            <img src={thumb} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
          ) : (
            <div
              className={cn(
                'grid size-14 shrink-0 place-items-center rounded-lg',
                isOwn ? 'bg-white/15 text-white/80' : 'bg-muted text-stat-muted',
              )}
            >
              <ShoppingBag className="size-5" aria-hidden />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                'flex items-center gap-1.5 text-sm font-semibold',
                isOwn ? 'text-white' : 'text-ink',
              )}
            >
              <ShoppingBag className="size-3.5 shrink-0 opacity-80" aria-hidden />
              {count} item{count === 1 ? '' : 's'}
            </p>
            <p
              className={cn(
                'mt-0.5 text-xs',
                isOwn ? 'text-white/75' : 'text-stat-muted',
              )}
            >
              {cart.estimatedTotalDisplay === BUSINESS_PROVIDES_TOTAL_PRICE
                ? BUSINESS_PROVIDES_TOTAL_PRICE
                : `${cart.estimatedTotalDisplay} (estimated total)`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openSheet}
          className={cn(
            'flex w-full items-center justify-center border-t px-3 py-2 text-xs font-semibold transition-colors',
            isOwn
              ? 'border-white/20 text-emerald-200 hover:bg-white/10'
              : 'border-chat-border text-chat-accent hover:bg-muted/60',
          )}
        >
          {loading ? 'Loading…' : 'View sent cart'}
        </button>
      </div>

      <SentCartSummarySheet
        open={sheetOpen}
        cart={sheetCart}
        onClose={() => setSheetOpen(false)}
      />
    </>
  )
}
