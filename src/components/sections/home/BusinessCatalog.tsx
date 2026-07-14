import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { BusinessCatalogImage } from '@/components/business/BusinessCatalogImage'
import { CatalogItemDetailSheet } from '@/components/business/CatalogItemDetailSheet'
import {
  formatCatalogPrice,
} from '@/features/catalog/businessCatalogApi'
import {
  fetchHomeCatalogItems,
  type DiscoveryCatalogItem,
} from '@/features/catalog/publicCatalogDiscoveryApi'
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
  const [selectedItem, setSelectedItem] = useState<DiscoveryCatalogItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const { data: items = [], isPending, isError, refetch } = useQuery({
    queryKey: ['catalog', 'home', HOME_LIMIT],
    queryFn: () => fetchHomeCatalogItems(HOME_LIMIT),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const openItem = (item: DiscoveryCatalogItem) => {
    setSelectedItem(item)
    setDetailOpen(true)
  }

  const closeDetail = () => {
    setDetailOpen(false)
    setSelectedItem(null)
  }

  return (
    <section className="">
      <div className="bg-card container px-4 mx-auto py-12 lg:py-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="lg:text-3xl text-2xl font-inter font-bold text-text-primary">
              Popular Services & Products
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-text-secondary font-inter">
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
                className="mt-3 text-primary font-medium underline-offset-2 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : items.length === 0 ? (
            <p className="py-12 text-center text-sm text-text-secondary font-inter">
              Premium catalog highlights will appear here soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openItem(item)}
                  className="flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-[0_1px_2px_rgba(16,22,32,0.05)] transition-transform transition-shadow duration-200 hover:scale-[1.01] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chat-accent"
                >
                  <div
                    className="relative"
                    style={{
                      background: item.imageUrl ? undefined : GRADIENTS[index % GRADIENTS.length],
                    }}
                  >
                    {item.imageUrl ? (
                      <BusinessCatalogImage src={item.imageUrl} alt={item.name} className="rounded-none" />
                    ) : (
                      <div className="aspect-[4/3] w-full" />
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
                  </div>
                  <div className="flex flex-1 flex-col px-3 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-stat-muted line-clamp-1">
                      {item.businessName}
                      {item.categoryName ? ` · ${item.categoryName}` : ''}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold leading-snug text-ink">{item.name}</h3>
                    {item.description ? (
                      <p className="mt-1 flex-1 text-xs leading-relaxed text-stat-muted line-clamp-2">
                        {item.description}
                      </p>
                    ) : null}
                    <div className="mt-2 flex items-end justify-between gap-2">
                      <p className="font-heading text-[15px] font-bold text-ink">
                        {formatCatalogPrice(item)}
                      </p>
                      {item.cityName || item.locationLabel ? (
                        <p className="text-[11px] text-stat-muted line-clamp-1">
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

      {selectedItem ? (
        <CatalogItemDetailSheet
          open={detailOpen}
          item={selectedItem}
          businessInfoId={selectedItem.businessInfoId}
          businessName={selectedItem.businessName}
          vendorUserUuid={selectedItem.vendorUserUuid}
          fromPath="/"
          showMessageBusiness
          messagesPath="/messages"
          onClose={closeDetail}
        />
      ) : null}
    </section>
  )
}
