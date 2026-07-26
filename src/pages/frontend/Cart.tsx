import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Minus, Plus, ShoppingBag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { useRequireAuthNavigate } from '@/features/auth/useRequireAuthNavigate'
import { businessCatalogBrowsePath, businessProfilePath } from '@/lib/businessProfile'
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
  const [searchParams] = useSearchParams()
  const businessParam = Number(searchParams.get('business') ?? '')
  const scopedBusinessId =
    Number.isFinite(businessParam) && businessParam > 0 ? businessParam : null

  const { requireAuthNavigate, isAuthReady, isAuthenticated } = useRequireAuthNavigate()
  const { carts, totalItemCount, isLoading: cartsLoading } = useBuyerCarts()
  const selectedBusinessId = scopedBusinessId ?? carts[0]?.businessInfoId ?? null
  const cartApi = useBuyerCatalogCart(selectedBusinessId)
  const [sending, setSending] = useState(false)

  const cart = useMemo(() => {
    if (scopedBusinessId) return cartApi.cart
    return carts.find((entry) => entry.businessInfoId === selectedBusinessId) ?? cartApi.cart
  }, [cartApi.cart, carts, scopedBusinessId, selectedBusinessId])

  const addMorePath = cart
    ? businessCatalogBrowsePath(cart.businessInfoId)
    : '/catalog'

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
        navigate({ pathname: '/messages', search: `?${search.toString()}` }, { state: { from: '/cart' } })
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

  if (cartsLoading && !cart) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-stat-muted">
        Loading cart…
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

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-white">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border-light bg-white px-3 py-3">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate(-1)}
          className="grid size-10 place-items-center rounded-full hover:bg-auth-bg"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <h1 className="font-heading text-lg font-bold text-ink">Your cart</h1>
      </header>

      <div className="flex items-center justify-between gap-3 px-4 py-3">
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
          className="rounded-lg border border-border-light px-3 py-1.5 text-sm font-semibold text-chat-accent"
        >
          Add more
        </Link>
      </div>

      {!scopedBusinessId && carts.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto px-4 pb-2">
          {carts.map((entry) => (
            <Link
              key={entry.id}
              to={`/cart?business=${entry.businessInfoId}`}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold',
                entry.businessInfoId === cart.businessInfoId
                  ? 'border-ink bg-ink text-white'
                  : 'border-border-light text-body-secondary',
              )}
            >
              {entry.businessName} ({entry.itemCount})
            </Link>
          ))}
        </div>
      ) : null}

      <ul className="divide-y divide-border-light">
        {cart.items.map((line) => (
          <li key={line.id} className="flex gap-3 px-4 py-3.5">
            {line.imageUrl ? (
              <img src={line.imageUrl} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="grid size-14 shrink-0 place-items-center rounded-lg bg-muted text-stat-muted">
                <ShoppingBag className="size-5" aria-hidden />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-sm font-semibold text-ink">{line.name}</p>
                <p className="shrink-0 text-sm font-semibold text-ink">{line.lineTotalDisplay}</p>
              </div>
              <div className="mt-2 inline-flex items-center gap-0.5 rounded-md bg-[#f0f2f5]">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={sending}
                  onClick={() => void cartApi.setQtyByCartItemId(line.id, line.quantity - 1)}
                  className="grid size-8 place-items-center text-ink disabled:opacity-50"
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
                  className="grid size-8 place-items-center text-ink disabled:opacity-50"
                >
                  <Plus className="size-3.5" aria-hidden />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="border-t border-border-light px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-stat-muted">Estimated total</span>
          <span className="text-base font-bold text-ink">{cart.estimatedTotalDisplay}</span>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-stat-muted">{CONSENT}</p>
        <button
          type="button"
          disabled={sending || cart.itemCount === 0}
          onClick={handleSend}
          className="mt-4 flex w-full items-center justify-center rounded-full bg-chat-accent px-4 py-3.5 text-[15px] font-semibold text-white disabled:opacity-60"
        >
          {sending ? 'Sending…' : 'Send to business'}
        </button>
        <Link
          to={businessProfilePath(cart.businessInfoId)}
          className="mt-3 block text-center text-xs font-semibold text-stat-muted hover:text-ink"
        >
          View {cart.businessName}
        </Link>
      </div>
    </div>
  )
}
