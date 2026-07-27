import { ShoppingBag } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { useBuyerCarts } from '@/hooks/useBuyerCatalogCart'
import { cn } from '@/lib/utils'

type CatalogFloatingCartFabProps = {
  href?: string
  className?: string
}

/** WhatsApp-style floating cart — fixed bottom-right on public pages (API-backed). */
export function CatalogFloatingCartFab({
  href = '/cart',
  className,
}: CatalogFloatingCartFabProps) {
  const { pathname } = useLocation()
  const { totalItemCount } = useBuyerCarts()

  const onCartPage = pathname === '/cart' || pathname.startsWith('/cart/')
  const onMessages =
    pathname.startsWith('/messages') || pathname.startsWith('/user/messages')

  if (totalItemCount <= 0 || onCartPage || onMessages) return null

  return (
    <Link
      to={href}
      aria-label={`Open cart, ${totalItemCount} items`}
      className={cn(
        'fixed z-50 grid size-14 place-items-center rounded-full',
        'right-5 bottom-6 sm:right-8 sm:bottom-8',
        'max-lg:bottom-24',
        'bg-white text-ink shadow-[0_8px_28px_rgba(15,23,42,0.18)] ring-1 ring-black/5',
        'transition-transform duration-200 hover:scale-105 active:scale-95',
        className,
      )}
    >
      <ShoppingBag className="size-6 text-chat-accent" aria-hidden />
      <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-chat-accent px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
        {totalItemCount > 99 ? '99+' : totalItemCount}
      </span>
    </Link>
  )
}
