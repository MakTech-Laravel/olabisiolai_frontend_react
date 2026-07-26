import { ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useBuyerCarts } from '@/hooks/useBuyerCatalogCart'
import { cn } from '@/lib/utils'

type CatalogFloatingCartFabProps = {
  href?: string
  className?: string
}

/** WhatsApp-style floating cart with live badge (API-backed). */
export function CatalogFloatingCartFab({
  href = '/cart',
  className,
}: CatalogFloatingCartFabProps) {
  const { totalItemCount } = useBuyerCarts()

  if (totalItemCount <= 0) return null

  return (
    <Link
      to={href}
      aria-label={`Open cart, ${totalItemCount} items`}
      className={cn(
        'fixed bottom-20 right-4 z-40 grid size-14 place-items-center rounded-full bg-white text-ink shadow-lg ring-1 ring-black/5 transition-transform hover:scale-105 sm:bottom-8 sm:right-8',
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
