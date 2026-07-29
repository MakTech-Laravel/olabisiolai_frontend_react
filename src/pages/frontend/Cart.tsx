import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Minus, Plus, ShoppingBag } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { useRequireAuthNavigate } from '@/features/auth/useRequireAuthNavigate'
import { BUSINESS_PROVIDES_TOTAL_PRICE } from '@/features/catalog/cartPricing'
import { CartLinePriceDisplay } from '@/components/catalog/CatalogPriceDisplay'
import { useBuyerCarts, useBuyerCatalogCart } from '@/hooks/useBuyerCatalogCart'
import { directMessageTo } from '@/lib/directMessage'
import { getLaravelErrorMessage } from '@/lib/laravelApiError'
import { showError } from '@/lib/sweetAlert'
import { cn } from '@/lib/utils'

const CONSENT =
  'By continuing, you agree to share your cart, profile name and phone number with the business so it can confirm your order and total price, including any tax, fees and discounts.'

export default function CartPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const businessParam = Number(searchParams.get('business') ?? '')
  const requestedBusinessId =
    Number.isFinite(businessParam) && businessParam > 0 ? businessParam : null

  const { requireAuthNavigate, isAuthReady, isAuthenticated } = useRequireAuthNavigate()
  const { carts, totalItemCount, isLoading: cartsLoading } = useBuyerCarts()

  const selectedBusinessId = useMemo(() => {
    if (requestedBusinessId && carts.some((entry) => entry.businessInfoId === requestedBusinessId)) {
      return requestedBusinessId
    }
    return carts[0]?.businessInfoId ?? requestedBusinessId ?? null
  }, [carts, requestedBusinessId])

  const cartApi = useBuyerCatalogCart(selectedBusinessId)
  const [sending, setSending] = useState(false)

  /** Prefer per-business query when loaded (fresh qty); fall back to list for instant tab switches. */
  const cart = useMemo(() => {
    if (!selectedBusinessId) return null
    if (cartApi.cart?.businessInfoId === selectedBusinessId) return cartApi.cart
    return carts.find((entry) => entry.businessInfoId === selectedBusinessId) ?? null
  }, [cartApi.cart, carts, selectedBusinessId])

  const selectBusiness = (businessInfoId: number) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('business', String(businessInfoId))
        return next
      },
      { replace: true },
    )
  }

  // Zero-item businesses are filtered out of `carts`; switch away if the URL still points at one.
  useEffect(() => {
    if (cartsLoading) return
    if (carts.length === 0) return
    if (selectedBusinessId && carts.some((entry) => entry.businessInfoId === selectedBusinessId)) {
      return
    }
    const nextId = carts[0].businessInfoId
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('business', String(nextId))
        return next
      },
      { replace: true },
    )
  }, [carts, cartsLoading, selectedBusinessId, setSearchParams])

  /** Add more → global discovery catalog (filters), not the separate business browse page. */
  const addMorePath = '/catalog'

  const handleSend = () => {
    if (!cart || sending) return
    if (!isAuthReady) return

    if (!isAuthenticated) {
      requireAuthNavigate(directMessageTo({ from: '/cart', businessInfoId: cart.businessInfoId }))
      return
    }

    void (async () => {
      setSending(true)
      try {
        const result = await cartApi.send()
        void queryClient.invalidateQueries({ queryKey: ['conversations'] })

        const search = new URLSearchParams()
        search.set('scope', 'personal')
        search.set('c', result.conversationUuid)
        navigate(
          { pathname: '/messages', search: `?${search.toString()}` },
          { state: { from: '/cart' } },
        )
      } catch (error) {
        showError(getLaravelErrorMessage(error, 'Could not send cart.'))
      } finally {
        setSending(false)
      }
    })()
  }

  if (!isAuthReady) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-stat-muted">
        Loading…
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <ShoppingBag className="size-10 text-chat-accent" aria-hidden />
        <p className="text-sm text-body-secondary">Sign in to view and send your catalog cart.</p>
        <button
          type="button"
          onClick={() => requireAuthNavigate('/cart')}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white"
        >
          Sign in
        </button>
      </div>
    )
  }

  if (cartsLoading && carts.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-stat-muted">
        Loading cart…
      </div>
    )
  }

  if (carts.length === 0 || totalItemCount === 0) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <ShoppingBag className="size-10 text-stat-muted" aria-hidden />
        <p className="text-sm text-body-secondary">Your cart is empty.</p>
        <Link to="/catalog" className="text-sm font-semibold text-chat-accent hover:underline">
          Browse catalog
        </Link>
      </div>
    )
  }

  if (!cart || cart.itemCount === 0) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <ShoppingBag className="size-10 text-stat-muted" aria-hidden />
        <p className="text-sm text-body-secondary">Your cart is empty.</p>
        <Link to="/catalog" className="text-sm font-semibold text-chat-accent hover:underline">
          Browse catalog
        </Link>
      </div>
    )
  }

  /** Any "from" / estimate line → business confirms total (no estimated amount in footer). */
  const businessProvidesTotal = cart.items.some(
    (line) => line.priceFrom || line.lineTotalKobo === null,
  )

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-auth-bg lg:bg-[#f4f6f8] lg:py-8">
      <div
        className={cn(
          'mx-auto flex min-h-full w-full flex-col bg-white',
          'lg:min-h-0 lg:max-w-2xl lg:overflow-hidden lg:rounded-2xl lg:shadow-[0_8px_30px_rgba(15,23,42,0.08)]',
        )}
      >
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border-light bg-white/95 px-3 py-3 backdrop-blur-md lg:px-5 lg:py-4">
          <button
            type="button"
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="grid size-10 place-items-center rounded-full transition-colors hover:bg-auth-bg"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-lg font-bold text-ink lg:text-xl">Your cart</h1>
            <p className="truncate text-xs text-stat-muted">{cart.businessName}</p>
          </div>
        </header>

        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-5">
          <p className="text-sm font-semibold text-ink">
            {cart.itemCount} item{cart.itemCount === 1 ? '' : 's'}
            {totalItemCount > cart.itemCount ? (
              <span className="ml-1 font-normal text-stat-muted">
                ({totalItemCount} across businesses)
              </span>
            ) : null}
          </p>
          <Link
            to={addMorePath}
            className="rounded-lg border border-border-light bg-white px-3 py-1.5 text-sm font-semibold text-chat-accent transition-colors hover:bg-auth-bg"
          >
            Add more
          </Link>
        </div>

        {carts.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto px-4 pb-2 lg:px-5">
            {carts.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => selectBusiness(entry.businessInfoId)}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                  entry.businessInfoId === cart.businessInfoId
                    ? 'border-ink bg-ink text-white'
                    : 'border-border-light text-body-secondary hover:bg-auth-bg',
                )}
              >
                {entry.businessName} ({entry.itemCount})
              </button>
            ))}
          </div>
        ) : null}

        <ul className="min-h-0 flex-1 divide-y divide-border-light overflow-y-auto">
          {cart.items.map((line) => {
            const showExactPrice = !line.priceFrom && line.lineTotalKobo !== null

            return (
              <li
                key={line.id}
                className="flex gap-3 px-4 py-3.5 transition-colors hover:bg-[#fafbfc] lg:px-5"
              >
                {line.imageUrl ? (
                  <img
                    src={line.imageUrl}
                    alt=""
                    className="size-14 shrink-0 rounded-lg object-cover lg:size-16"
                  />
                ) : (
                  <div className="grid size-14 shrink-0 place-items-center rounded-lg bg-muted text-stat-muted lg:size-16">
                    <ShoppingBag className="size-5" aria-hidden />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-2 text-sm font-semibold text-ink lg:text-[15px]">
                      {line.name}
                    </p>
                    {showExactPrice ? (
                      <CartLinePriceDisplay
                        className="shrink-0 text-sm"
                        saleDisplay={line.lineTotalDisplay}
                        originalUnitPriceKobo={line.originalUnitPriceKobo}
                        quantity={line.quantity}
                        hasDiscount={line.hasDiscount}
                      />
                    ) : null}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-0.5 rounded-md bg-[#f0f2f5]">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      disabled={sending}
                      onClick={() => void cartApi.setQtyByCartItemId(line.id, line.quantity - 1)}
                      className="grid size-8 place-items-center text-ink transition-colors hover:bg-white disabled:opacity-50"
                    >
                      <Minus className="size-3.5" aria-hidden />
                    </button>
                    <span className="min-w-6 text-center text-sm font-semibold tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={sending}
                      onClick={() => void cartApi.setQtyByCartItemId(line.id, line.quantity + 1)}
                      className="grid size-8 place-items-center text-ink transition-colors hover:bg-white disabled:opacity-50"
                    >
                      <Plus className="size-3.5" aria-hidden />
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="sticky bottom-0 border-t border-border-light bg-white px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0))] lg:px-5 lg:py-5">
          {businessProvidesTotal ? (
            <p className="text-base font-bold text-ink">{BUSINESS_PROVIDES_TOTAL_PRICE}</p>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-stat-muted">Estimated total</span>
              <span className="text-base font-bold tabular-nums text-ink">
                {cart.estimatedTotalDisplay}
              </span>
            </div>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-stat-muted lg:text-xs">{CONSENT}</p>
          <button
            type="button"
            disabled={sending || cart.itemCount === 0}
            onClick={handleSend}
            className="mt-4 flex w-full items-center justify-center rounded-full bg-chat-accent px-4 py-3.5 text-[15px] font-semibold text-white transition-opacity hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
          >
            {sending ? 'Sending…' : 'Send to business'}
          </button>
        </div>
      </div>
    </div>
  )
}
