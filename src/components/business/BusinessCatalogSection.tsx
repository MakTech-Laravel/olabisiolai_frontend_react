import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Crown, MessageCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { BusinessCatalogImage } from '@/components/business/BusinessCatalogImage'
import { CatalogAddToCartControl } from '@/components/business/CatalogAddToCartControl'
import { VendorCatalogCartBar } from '@/components/business/VendorCatalogCartBar'
import { CATALOG_BUSINESS_PAGE_PREVIEW } from '@/constants/config'
import { useRequireAuthNavigate } from '@/features/auth/useRequireAuthNavigate'
import {
  formatCatalogPrice,
  type BusinessCatalogItem,
  type CatalogItemType,
} from '@/features/catalog/businessCatalogApi'
import { seedNewConversationInCache } from '@/features/messaging/conversationCache'
import { startDirectConversationWithVendor } from '@/features/messaging/startDirectConversation'
import { useBuyerCatalogCart } from '@/hooks/useBuyerCatalogCart'
import { buildVendorPremiumInfoPath } from '@/hooks/useVendorSubscriptionAccess'
import { CATALOG_IMAGE_ASPECT_CLASS } from '@/lib/businessImageLayout'
import { businessCatalogBrowsePath } from '@/lib/businessProfile'
import { businessPageCatalogGrid } from '@/lib/businessPageLayout'
import { catalogItemDetailPath } from '@/lib/catalogItemDetail'
import { directMessageTo } from '@/lib/directMessage'
import { showError } from '@/lib/sweetAlert'
import { cn } from '@/lib/utils'

const GRADIENTS = [
  'linear-gradient(135deg,#2e3b52,#46587a)',
  'linear-gradient(135deg,#7a4b2a,#a3683b)',
  'linear-gradient(135deg,#1f5f4f,#2f8a72)',
  'linear-gradient(135deg,#43325c,#6b4f8f)',
  'linear-gradient(135deg,#5a2e3b,#8a4658)',
  'linear-gradient(135deg,#2a4a6a,#3f6c97)',
]

type CatalogFilter = 'all' | CatalogItemType

type BusinessCatalogSectionProps = {
  items: BusinessCatalogItem[]
  catalogLocked: boolean
  isOwnerMode?: boolean
  businessId?: number | null
  businessName?: string
  vendorUserUuid?: string | null
  fromPath?: string
  showMessageBusiness?: boolean
  messagesPath?: '/messages' | '/user/messages'
  initialSelectedItemId?: number | null
  /** When false, show the full filtered list (browse page). */
  previewLimit?: number | null
  className?: string
}

export function BusinessCatalogSection({
  items,
  catalogLocked,
  isOwnerMode = false,
  businessId = null,
  businessName = '',
  vendorUserUuid = null,
  fromPath = '',
  showMessageBusiness = false,
  messagesPath = '/messages',
  initialSelectedItemId = null,
  previewLimit = CATALOG_BUSINESS_PAGE_PREVIEW,
  className,
}: BusinessCatalogSectionProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<CatalogFilter>('all')
  const [messaging, setMessaging] = useState(false)

  const cartEnabled = !catalogLocked && !isOwnerMode && !!businessId && showMessageBusiness
  const cart = useBuyerCatalogCart(cartEnabled ? businessId : null)
  const { requireAuthNavigate, isAuthReady, isAuthenticated } = useRequireAuthNavigate()

  const filtered = useMemo(() => {
    if (filter === 'all') return items
    return items.filter((item) => item.type === filter)
  }, [filter, items])

  const hasMore =
    previewLimit != null && previewLimit > 0 && filtered.length > previewLimit
  const visibleItems = hasMore ? filtered.slice(0, previewLimit) : filtered

  const upgradePath =
    businessId !== null ? buildVendorPremiumInfoPath(businessId) : buildVendorPremiumInfoPath()

  const openItem = (item: BusinessCatalogItem) => {
    if (!businessId) return
    navigate(catalogItemDetailPath(item.id), {
      state: {
        from: fromPath || window.location.pathname,
        item,
        businessInfoId: businessId,
        businessName: businessName || 'Business',
        vendorUserUuid,
        messagesPath,
        showMessageBusiness: showMessageBusiness && !isOwnerMode,
        enableCatalogCart: !catalogLocked && showMessageBusiness && !isOwnerMode,
      },
    })
  }

  useEffect(() => {
    if (!initialSelectedItemId || !businessId) return
    const item = items.find((entry) => entry.id === initialSelectedItemId)
    if (!item) return
    navigate(catalogItemDetailPath(item.id), {
      replace: true,
      state: {
        from: fromPath || window.location.pathname,
        item,
        businessInfoId: businessId,
        businessName: businessName || 'Business',
        vendorUserUuid,
        messagesPath,
        showMessageBusiness: showMessageBusiness && !isOwnerMode,
        enableCatalogCart: !catalogLocked && showMessageBusiness && !isOwnerMode,
      },
    })
  }, [
    initialSelectedItemId,
    businessId,
    items,
    fromPath,
    businessName,
    vendorUserUuid,
    messagesPath,
    showMessageBusiness,
    isOwnerMode,
    catalogLocked,
    navigate,
  ])

  const handleLookingForSomethingElse = () => {
    if (!businessId || messaging) return
    if (!isAuthReady) return

    const path = fromPath || window.location.pathname

    if (!isAuthenticated) {
      requireAuthNavigate(
        directMessageTo(
          {
            from: path,
            participantUserUuid: vendorUserUuid ?? undefined,
            businessInfoId: businessId,
          },
          messagesPath,
        ),
      )
      return
    }

    void (async () => {
      setMessaging(true)
      try {
        const conv = await startDirectConversationWithVendor({
          vendorUserUuid,
          businessInfoId: businessId,
        })
        seedNewConversationInCache(queryClient, conv, 'personal')
        const search = new URLSearchParams()
        search.set('scope', 'personal')
        search.set('c', conv.uuid)
        navigate(
          { pathname: messagesPath, search: `?${search.toString()}` },
          { state: { from: path } },
        )
      } catch (err) {
        showError(err instanceof Error && err.message ? err.message : 'Could not start conversation')
      } finally {
        setMessaging(false)
      }
    })()
  }

  const handleSendCart = () => {
    if (!businessId) return
    if (!isAuthReady) return
    if (!isAuthenticated) {
      requireAuthNavigate(
        directMessageTo(
          {
            from: fromPath || window.location.pathname,
            participantUserUuid: vendorUserUuid ?? undefined,
            businessInfoId: businessId,
          },
          messagesPath,
        ),
      )
      return
    }
    navigate(`/cart?business=${businessId}`)
  }

  if (catalogLocked && !isOwnerMode) {
    return null
  }

  if (catalogLocked && isOwnerMode) {
    return (
      <section className={cn('space-y-4', className)}>
        <div>
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-ink md:text-4xl">Catalog</h2>
          <p className="mt-2 max-w-3xl text-lg leading-relaxed text-body-secondary">
            List what you offer with prices — available on Premium.
          </p>
        </div>
        <Link
          to={upgradePath}
          className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#e3d6b5] bg-[#fffbf0] px-5 py-7 text-center transition-colors hover:bg-[#fff6e3]"
        >
          <Crown className="size-8 text-[#9A6B1F]" strokeWidth={2} aria-hidden />
          <b className="font-heading text-base font-bold text-ink">Unlock your catalog</b>
          <span className="max-w-xs text-sm leading-relaxed text-body-secondary">
            Add products and services with prices so customers know what you offer.
          </span>
          <span className="mt-2 inline-flex rounded-full bg-gradient-to-br from-[#9A6B1F] to-[#C99A3F] px-4 py-2 text-sm font-bold text-white">
            Upgrade to Premium
          </span>
        </Link>
      </section>
    )
  }

  return (
    <section className={cn('space-y-4', cartEnabled && cart.itemCount > 0 && 'pb-24', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-ink md:text-4xl">
            Catalog{' '}
            <span className="text-base font-semibold text-stat-muted">
              {items.length} item{items.length === 1 ? '' : 's'}
            </span>
          </h2>
          <p className="mt-2 max-w-3xl text-lg leading-relaxed text-body-secondary">
            Products and services offered by this business.
          </p>
        </div>
        {hasMore && businessId ? (
          <Link
            to={businessCatalogBrowsePath(businessId)}
            className="shrink-0 pt-1 text-sm font-semibold text-chat-accent hover:underline"
          >
            See all
          </Link>
        ) : null}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter catalog">
        {([
          ['all', 'All'],
          ['service', 'Services'],
          ['product', 'Products'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
            className={cn(
              'shrink-0 rounded-full border-[1.5px] px-4 py-2 text-sm font-semibold transition-colors',
              filter === key
                ? 'border-ink bg-ink text-white'
                : 'border-border-light bg-white text-body-secondary hover:bg-auth-bg',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {visibleItems.length > 0 ? (
        <div className={businessPageCatalogGrid}>
          {visibleItems.map((item, index) => {
            const qty = cart.qtyFor(item.id)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openItem(item)}
                className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl bg-white text-left shadow-[0_1px_2px_rgba(16,22,32,0.05)] transition-[transform,box-shadow] duration-200 hover:scale-[1.01] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chat-accent"
              >
                <div
                  className="relative shrink-0"
                  style={{
                    background: item.imageUrl
                      ? undefined
                      : GRADIENTS[index % GRADIENTS.length],
                  }}
                >
                  {item.imageUrl ? (
                    <BusinessCatalogImage
                      src={item.imageUrl}
                      alt={item.name}
                      className="rounded-none"
                      fit="cover"
                    />
                  ) : (
                    <div className={cn(CATALOG_IMAGE_ASPECT_CLASS, 'w-full')} />
                  )}
                  <span
                    className={cn(
                      'absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide',
                      item.type === 'service' ? 'text-chat-accent' : 'text-brand',
                    )}
                  >
                    {item.type}
                  </span>
                  {cartEnabled ? (
                    <div className="absolute bottom-2 right-2 z-10">
                      <CatalogAddToCartControl
                        qty={qty}
                        onAdd={() => {
                          if (!isAuthReady) return
                          if (!isAuthenticated) {
                            requireAuthNavigate(fromPath || window.location.pathname)
                            return
                          }
                          void cart.addItem(item.id)
                        }}
                        onSetQty={(next) => void cart.setQty(item.id, next)}
                      />
                    </div>
                  ) : null}
                </div>
                <div className="flex min-h-0 flex-1 flex-col px-3 py-3">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{item.name}</h3>
                  {item.description ? (
                    <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-stat-muted">
                      {item.description}
                    </p>
                  ) : (
                    <span className="flex-1" aria-hidden />
                  )}
                  <p className="mt-2 line-clamp-1 font-heading text-[15px] font-bold text-ink">
                    {formatCatalogPrice(item)}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <p className="text-base text-body-secondary">No catalog items listed yet.</p>
      )}

      {hasMore && businessId ? (
        <div className="flex justify-center pt-1">
          <Link
            to={businessCatalogBrowsePath(businessId)}
            className="rounded-full border border-border-light bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-auth-bg"
          >
            See all {filtered.length} items
          </Link>
        </div>
      ) : null}

      {cartEnabled ? (
        <div className="pt-2">
          <button
            type="button"
            disabled={messaging}
            onClick={handleLookingForSomethingElse}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-light bg-white px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-auth-bg disabled:opacity-60"
          >
            <MessageCircle className="size-4 text-chat-accent" aria-hidden />
            {messaging ? 'Opening chat…' : 'Looking for something else'}
          </button>
        </div>
      ) : null}

      {cartEnabled && cart.itemCount > 0 ? (
        <VendorCatalogCartBar
          itemCount={cart.itemCount}
          estimatedTotalDisplay={cart.estimatedTotalDisplay}
          onReview={handleSendCart}
        />
      ) : null}
    </section>
  )
}
