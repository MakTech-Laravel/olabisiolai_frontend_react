import { useQuery } from '@tanstack/react-query'
import { Loader2, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { BusinessCatalogImage } from '@/components/business/BusinessCatalogImage'
import { CatalogItemDetailSheet } from '@/components/business/CatalogItemDetailSheet'
import { formatCatalogPrice, type CatalogItemType } from '@/features/catalog/businessCatalogApi'
import {
  fetchCatalogDiscoveryFeed,
  type DiscoveryCatalogItem,
} from '@/features/catalog/publicCatalogDiscoveryApi'
import { useCategoryCatalog } from '@/features/categories/useCategoryCatalog'
import { cn } from '@/lib/utils'

const GRADIENTS = [
  'linear-gradient(135deg,#2e3b52,#46587a)',
  'linear-gradient(135deg,#7a4b2a,#a3683b)',
  'linear-gradient(135deg,#1f5f4f,#2f8a72)',
  'linear-gradient(135deg,#43325c,#6b4f8f)',
  'linear-gradient(135deg,#5a2e3b,#8a4658)',
  'linear-gradient(135deg,#2a4a6a,#3f6c97)',
]

type TypeFilter = 'all' | CatalogItemType

export default function CatalogDiscoveryPage() {
  const [page, setPage] = useState(1)
  const [type, setType] = useState<TypeFilter>('all')
  const [categoryId, setCategoryId] = useState<number | 'all'>('all')
  const [cityInput, setCityInput] = useState('')
  const [city, setCity] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<DiscoveryCatalogItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const { data: categories = [] } = useCategoryCatalog()

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 350)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    const t = window.setTimeout(() => setCity(cityInput.trim()), 350)
    return () => window.clearTimeout(t)
  }, [cityInput])

  useEffect(() => {
    setPage(1)
  }, [type, categoryId, city, search])

  const feedQuery = useQuery({
    queryKey: ['catalog', 'feed', page, type, categoryId, city, search],
    queryFn: () =>
      fetchCatalogDiscoveryFeed({
        page,
        per_page: 24,
        type,
        category_id: categoryId === 'all' ? undefined : categoryId,
        city: city || undefined,
        search: search || undefined,
      }),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  })

  const items = feedQuery.data?.items ?? []
  const pagination = feedQuery.data?.pagination
  const lastPage = pagination?.last_page ?? 1

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ id: c.id, name: c.name })),
    [categories],
  )

  const openItem = (item: DiscoveryCatalogItem) => {
    setSelectedItem(item)
    setDetailOpen(true)
  }

  return (
    <div className="min-h-dvh bg-bg-section">
      <div className="container mx-auto px-4 py-10 lg:py-14">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-chat-accent">Discovery</p>
          <h1 className="mt-1 text-3xl font-inter font-bold text-text-primary lg:text-4xl">Catalog</h1>
          <p className="mt-2 max-w-2xl text-sm text-text-secondary">
            Premium products and services, trending offers, and recommendations by category and city.
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stat-muted" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products, services, or businesses…"
              className="h-11 w-full rounded-xl border border-border-light bg-white pl-10 pr-3 text-sm outline-none focus:border-chat-accent"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {([
              ['all', 'All'],
              ['service', 'Services'],
              ['product', 'Products'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={type === key}
                onClick={() => setType(key)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  type === key
                    ? 'border-ink bg-ink text-white'
                    : 'border-border-light bg-white text-body-secondary hover:bg-auth-bg',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={categoryId === 'all' ? 'all' : String(categoryId)}
              onChange={(e) => {
                const value = e.target.value
                setCategoryId(value === 'all' ? 'all' : Number(value))
              }}
              className="h-10 rounded-xl border border-border-light bg-white px-3 text-sm"
            >
              <option value="all">All categories</option>
              {categoryOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="Filter by city / LGA / state"
              className="h-10 rounded-xl border border-border-light bg-white px-3 text-sm outline-none focus:border-chat-accent"
            />
          </div>
        </div>

        {feedQuery.isLoading && !feedQuery.data ? (
          <div className="flex justify-center py-20 text-text-secondary">
            <Loader2 className="size-9 animate-spin" aria-hidden />
          </div>
        ) : feedQuery.isError ? (
          <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-text-secondary">
            <p>Could not load the catalog feed.</p>
            <button
              type="button"
              onClick={() => void feedQuery.refetch()}
              className="mt-3 text-primary font-medium underline-offset-2 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-4 py-12 text-center">
            <p className="text-base font-medium text-text-primary">No catalog items match these filters.</p>
            <p className="mt-2 text-sm text-text-secondary">Try another category or city, or browse businesses.</p>
            <Link to="/filters" className="mt-4 inline-flex text-sm font-medium text-primary underline-offset-2 hover:underline">
              Browse businesses
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-2 text-sm text-text-secondary">
              <span>{pagination?.total ?? items.length} items</span>
              {feedQuery.isFetching ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
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
                      <p className="font-heading text-[15px] font-bold text-ink">{formatCatalogPrice(item)}</p>
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

            {lastPage > 1 ? (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1 || feedQuery.isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-border bg-white px-3 py-2 text-sm disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-text-secondary">
                  {page} / {lastPage}
                </span>
                <button
                  type="button"
                  disabled={page >= lastPage || feedQuery.isFetching}
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  className="rounded-lg border border-border bg-white px-3 py-2 text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
