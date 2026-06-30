import { useMemo, useState } from 'react'
import { Crown } from 'lucide-react'
import { Link } from 'react-router-dom'

import { CatalogItemDetailSheet } from '@/components/business/CatalogItemDetailSheet'
import { BusinessCatalogImage } from '@/components/business/BusinessCatalogImage'
import {
  formatCatalogPrice,
  type BusinessCatalogItem,
  type CatalogItemType,
} from '@/features/catalog/businessCatalogApi'
import { buildVendorPremiumInfoPath } from '@/hooks/useVendorSubscriptionAccess'
import { businessPageCatalogGrid } from '@/lib/businessPageLayout'
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
  className,
}: BusinessCatalogSectionProps) {
  const [filter, setFilter] = useState<CatalogFilter>('all')
  const [selectedItem, setSelectedItem] = useState<BusinessCatalogItem | null>(() => {
    if (!initialSelectedItemId) return null
    return items.find((item) => item.id === initialSelectedItemId) ?? null
  })
  const [detailOpen, setDetailOpen] = useState(() => {
    if (!initialSelectedItemId) return false
    return items.some((item) => item.id === initialSelectedItemId)
  })

  const filtered = useMemo(() => {
    if (filter === 'all') return items
    return items.filter((item) => item.type === filter)
  }, [filter, items])

  const upgradePath =
    businessId !== null ? buildVendorPremiumInfoPath(businessId) : buildVendorPremiumInfoPath()

  const openItem = (item: BusinessCatalogItem) => {
    setSelectedItem(item)
    setDetailOpen(true)
  }

  const closeDetail = () => {
    setDetailOpen(false)
    setSelectedItem(null)
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
    <>
      <section className={cn('space-y-4', className)}>
        <div>
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

        {filtered.length > 0 ? (
          <div className={businessPageCatalogGrid}>
            {filtered.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openItem(item)}
                className="flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-[0_1px_2px_rgba(16,22,32,0.05)] transition-transform transition-shadow duration-200 hover:scale-[1.01] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chat-accent"
              >
                <div
                  className="relative"
                  style={{
                    background: item.imageUrl
                      ? undefined
                      : GRADIENTS[index % GRADIENTS.length],
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
                </div>
                <div className="flex flex-1 flex-col px-3 py-3">
                  <h3 className="text-sm font-semibold leading-snug text-ink">{item.name}</h3>
                  {item.description ? (
                    <p className="mt-1 flex-1 text-xs leading-relaxed text-stat-muted line-clamp-2">
                      {item.description}
                    </p>
                  ) : null}
                  <p className="mt-2 font-heading text-[15px] font-bold text-ink">
                    {formatCatalogPrice(item)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-base text-body-secondary">No catalog items listed yet.</p>
        )}
      </section>

      {businessId && selectedItem ? (
        <CatalogItemDetailSheet
          open={detailOpen}
          item={selectedItem}
          businessInfoId={businessId}
          businessName={businessName || 'Business'}
          vendorUserUuid={vendorUserUuid}
          fromPath={fromPath || window.location.pathname}
          showMessageBusiness={showMessageBusiness && !isOwnerMode}
          messagesPath={messagesPath}
          onClose={closeDetail}
        />
      ) : null}
    </>
  )
}
