import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { BusinessCatalogImage } from '@/components/business/BusinessCatalogImage'
import { CatalogAddToCartControl } from '@/components/business/CatalogAddToCartControl'
import { CatalogPriceDisplay } from '@/components/catalog/CatalogPriceDisplay'
import {
  fetchHomeCatalogItems,
  type DiscoveryCatalogItem,
} from '@/features/catalog/publicCatalogDiscoveryApi'
import { useDiscoveryCartActions } from '@/hooks/useDiscoveryCartActions'
import { CATALOG_IMAGE_ASPECT_CLASS } from '@/lib/businessImageLayout'
import { catalogItemDetailPath } from '@/lib/catalogItemDetail'
import { cn } from '@/lib/utils'

const GRADIENTS = [
  'linear-gradient(135deg,#2e3b52,#46587a)',
  'linear-gradient(135deg,#7a4b2a,#a3683b)',
  'linear-gradient(135deg,#1f5f4f,#2f8a72)',
  'linear-gradient(135deg,#43325c,#6b4f8f)',
  'linear-gradient(135deg,#5a2e3b,#8a4658)',
  'linear-gradient(135deg,#2a4a6a,#3f6c97)',
]

const HOME_LIMIT = 8

export default function BusinessCatalog() {
  const navigate = useNavigate()
  const cartActions = useDiscoveryCartActions('/')

  const { data: items = [], isPending, isError, refetch } = useQuery({
    queryKey: ['catalog', 'home', HOME_LIMIT],
    queryFn: () => fetchHomeCatalogItems(HOME_LIMIT),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const openItem = (item: DiscoveryCatalogItem) => {
    navigate(catalogItemDetailPath(item.id), {
      state: {
        from: '/',
        item,
        businessInfoId: item.businessInfoId,
        businessName: item.businessName,
        vendorUserUuid: item.vendorUserUuid,
        messagesPath: '/messages',
        showMessageBusiness: true,
        enableCatalogCart: item.isPremium,
      },
    })
  }

  return (
    <section className="">
      <div className="container mx-auto bg-card px-4 py-12 lg:py-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-inter text-2xl font-bold text-text-primary lg:text-3xl">
              Popular Services & Products
            </h2>
            <p className="mt-2 max-w-2xl font-inter text-sm text-text-secondary">
              A curated pick of premium catalog items. Explore the full discovery feed in Catalog.
            </p>
          </div>
        </div>

        <div className="mt-12">
          {isPending ? (
            <div className="flex justify-center py-16 text-text-secondary">
              <Loader2 className="size-9 animate-spin" aria-hidden />
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-text-secondary">
              <p>Catalog highlights could not be loaded.</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-3 font-medium text-primary underline-offset-2 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : items.length === 0 ? (
            <p className="py-12 text-center font-inter text-sm text-text-secondary">
              Premium catalog highlights will appear here soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openItem(item)}
                  className="flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-[0_1px_2px_rgba(16,22,32,0.05)] transition-[transform,box-shadow] duration-200 hover:scale-[1.01] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chat-accent"
                >
                  <div
                    className="relative"
                    style={{
                      background: item.imageUrl ? undefined : GRADIENTS[index % GRADIENTS.length],
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
                    {item.isBoosted ? (
                      <span className="absolute right-2 top-2 rounded-full bg-ink/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                        Trending
                      </span>
                    ) : null}
                    {item.isPremium ? (
                      <div className="absolute bottom-2 right-2 z-10">
                        <CatalogAddToCartControl
                          qty={cartActions.qtyFor(item.id)}
                          onAdd={() => void cartActions.addItem(item.id)}
                          onSetQty={(qty) => void cartActions.setQty(item.id, qty)}
                        />
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col px-3 py-3">
                    <p className="line-clamp-1 text-[11px] font-medium uppercase tracking-wide text-stat-muted">
                      {item.businessName}
                      {item.categoryName ? ` · ${item.categoryName}` : ''}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-ink">
                      {item.name}
                    </h3>
                    {item.description ? (
                      <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-stat-muted">
                        {item.description}
                      </p>
                    ) : null}
                    <div className="mt-2 flex items-end justify-between gap-2">
                      <CatalogPriceDisplay
                        item={item}
                        className="font-heading text-[15px] text-ink"
                        saleClassName="font-heading text-[15px] font-bold"
                      />
                      {item.cityName || item.locationLabel ? (
                        <p className="line-clamp-1 text-[11px] text-stat-muted">
                          {item.cityName || item.locationLabel}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative z-20 mt-8 text-center">
          <Link
            to="/catalog"
            className="relative z-20 inline-flex rounded-xl bg-primary px-4 py-3 font-inter text-lg font-normal text-primary-foreground"
          >
            View All Catalog Items
          </Link>
        </div>
      </div>
    </section>
  )
}
