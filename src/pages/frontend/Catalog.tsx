import { BusinessCatalogImage } from '@/components/business/BusinessCatalogImage'
import { CatalogItemDetailSheet } from '@/components/business/CatalogItemDetailSheet'
import FiltersSection from '@/components/sections/filters/FiltersSection'
import { formatCatalogPrice, type CatalogItemType } from '@/features/catalog/businessCatalogApi'
import {
  fetchCatalogDiscoveryFeed,
  type DiscoveryCatalogItem,
} from '@/features/catalog/publicCatalogDiscoveryApi'
import { useCategoryCatalog } from '@/features/categories/useCategoryCatalog'
import { useLocationCatalog } from '@/features/locations/useLocationCatalog'
import { CATALOG_IMAGE_ASPECT_CLASS } from '@/lib/businessImageLayout'
import { cn } from '@/lib/utils'
import { router } from '@/routes/router'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Loader2, RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

const GRADIENTS = [
  'linear-gradient(135deg,#2e3b52,#46587a)',
  'linear-gradient(135deg,#7a4b2a,#a3683b)',
  'linear-gradient(135deg,#1f5f4f,#2f8a72)',
  'linear-gradient(135deg,#43325c,#6b4f8f)',
  'linear-gradient(135deg,#5a2e3b,#8a4658)',
  'linear-gradient(135deg,#2a4a6a,#3f6c97)',
]

const CATALOG_BASE_PATH = '/catalog'

type TypeFilter = 'all' | CatalogItemType

export default function CatalogDiscoveryPage() {
  const queryClient = useQueryClient()
  const [showFilters, setShowFilters] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedItem, setSelectedItem] = useState<DiscoveryCatalogItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const perPage = 24

  const categoryIdParam = searchParams.get('category_id')
  const categoryNameParam = (searchParams.get('category') ?? '').trim()
  const searchTerm = (searchParams.get('search') ?? '').trim()
  const locationRaw = Number(searchParams.get('location_id') ?? '')
  const selectedLocationId = Number.isFinite(locationRaw) && locationRaw > 0 ? locationRaw : null
  const typeParam = (searchParams.get('type') ?? '').trim().toLowerCase()
  const typeFilter: TypeFilter =
    typeParam === 'product' || typeParam === 'service' ? typeParam : 'all'

  const [searchInput, setSearchInput] = useState(searchTerm)

  useEffect(() => {
    setSearchInput(searchTerm)
  }, [searchTerm])

  useEffect(() => {
    const nextValue = searchInput.trim()
    if (nextValue === searchTerm) return

    const timer = window.setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (!nextValue) next.delete('search')
          else next.set('search', nextValue)
          return next
        },
        { replace: true },
      )
    }, 350)

    return () => window.clearTimeout(timer)
  }, [searchInput, searchTerm, setSearchParams])

  const { data: apiCategories = [], isPending: categoriesLoading } = useCategoryCatalog()
  const { data: catalogLocations = [] } = useLocationCatalog()

  const filterCategoryId = useMemo<number | null>(() => {
    const rawId = Number(categoryIdParam ?? '')
    if (Number.isFinite(rawId) && rawId > 0) return rawId
    if (categoryNameParam && apiCategories.length > 0) {
      const byName = apiCategories.find((c) => c.name === categoryNameParam)
      if (byName) return byName.id
    }
    return null
  }, [categoryIdParam, categoryNameParam, apiCategories])

  const filterCategoryName = useMemo(() => {
    if (filterCategoryId == null) return null
    return apiCategories.find((c) => c.id === filterCategoryId)?.name ?? null
  }, [apiCategories, filterCategoryId])

  const locationOptions = useMemo(() => {
    return [...catalogLocations].sort((a, b) => a.label.localeCompare(b.label))
  }, [catalogLocations])

  const cityFilter = useMemo(() => {
    if (selectedLocationId == null) return ''
    const location = locationOptions.find((opt) => opt.id === selectedLocationId)
    if (!location) return ''
    return (
      location.lgaName?.trim() ||
      location.cityName?.trim() ||
      location.stateName?.trim() ||
      location.label.trim()
    )
  }, [selectedLocationId, locationOptions])

  const filterQueryKey = useMemo(
    () => ['catalog', 'feed', filterCategoryId, selectedLocationId, cityFilter, searchTerm, typeFilter, perPage],
    [filterCategoryId, selectedLocationId, cityFilter, searchTerm, typeFilter, perPage],
  )

  const feedQuery = useInfiniteQuery({
    queryKey: filterQueryKey,
    queryFn: ({ pageParam }) =>
      fetchCatalogDiscoveryFeed({
        page: pageParam,
        per_page: perPage,
        category_id: filterCategoryId ?? undefined,
        city: cityFilter || undefined,
        search: searchTerm || undefined,
        type: typeFilter,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.current_page < lastPage.pagination.last_page
        ? lastPage.pagination.current_page + 1
        : undefined,
    staleTime: 60_000,
  })

  const items = useMemo<DiscoveryCatalogItem[]>(() => {
    if (feedQuery.isError) return []
    return feedQuery.data?.pages.flatMap((page) => page.items) ?? []
  }, [feedQuery.data?.pages, feedQuery.isError])

  const totalCount = feedQuery.data?.pages[0]?.pagination.total ?? items.length
  const itemsLoading = feedQuery.isPending

  const handleSelectCategory = (categoryId: number | null) => {
    const next = new URLSearchParams(searchParams)
    if (categoryId == null) {
      next.delete('category_id')
      next.delete('category')
    } else {
      next.set('category_id', String(categoryId))
      next.delete('category')
    }
    setSearchParams(next, { replace: true })
  }

  const handleSelectLocation = (locationId: number | null) => {
    const next = new URLSearchParams(searchParams)
    if (locationId === null) next.delete('location_id')
    else next.set('location_id', String(locationId))
    setSearchParams(next, { replace: true })
  }

  const handleSearchTermChange = (value: string) => {
    setSearchInput(value)
  }

  const handleTypeChange = (value: TypeFilter) => {
    const next = new URLSearchParams(searchParams)
    if (value === 'all') next.delete('type')
    else next.set('type', value)
    setSearchParams(next, { replace: true })
  }

  const hasActiveFilters = useMemo(() => {
    const hasCategoryInUrl = Boolean(categoryIdParam?.trim()) || categoryNameParam.length > 0
    return (
      hasCategoryInUrl ||
      searchInput.trim().length > 0 ||
      searchTerm.length > 0 ||
      selectedLocationId != null ||
      typeFilter !== 'all'
    )
  }, [
    categoryIdParam,
    categoryNameParam,
    searchInput,
    searchTerm,
    selectedLocationId,
    typeFilter,
  ])

  const onResetFiltersClick = useCallback(
    (event?: { preventDefault?: () => void }) => {
      event?.preventDefault?.()
      setShowFilters(false)
      setSearchInput('')
      void queryClient.cancelQueries({ queryKey: ['catalog', 'feed'] })
      void queryClient.removeQueries({ queryKey: ['catalog', 'feed'] })
      void router.navigate(CATALOG_BASE_PATH, { replace: true })
      setSearchParams('', { replace: true })
    },
    [queryClient, setSearchParams],
  )

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first?.isIntersecting && feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
          void feedQuery.fetchNextPage()
        }
      },
      { rootMargin: '240px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [feedQuery.fetchNextPage, feedQuery.hasNextPage, feedQuery.isFetchingNextPage])

  const openItem = (item: DiscoveryCatalogItem) => {
    setSelectedItem(item)
    setDetailOpen(true)
  }

  const closeDetail = () => {
    setDetailOpen(false)
    setSelectedItem(null)
  }

  const filtersSectionProps = {
    categories: apiCategories,
    selectedCategoryId: filterCategoryId,
    onSelectCategory: handleSelectCategory,
    subcategoryOptions: [] as string[],
    selectedSubcategory: null as string | null,
    onSelectSubcategory: () => undefined,
    locationOptions,
    selectedLocationId,
    onSelectLocation: handleSelectLocation,
    searchTerm: searchInput,
    onSearchTermChange: handleSearchTermChange,
    verifiedOnly: false,
    onVerifiedOnlyChange: () => undefined,
    selectedMinRating: null as number | null,
    onSelectMinRating: () => undefined,
    categoriesLoading,
    showVerifiedOnly: false,
    showMinRating: false,
    showSubcategory: false,
    searchPlaceholder: 'Search products, services, or businesses…',
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card shadow-sm px-4 py-4 sm:px-6">
        <div className="container mx-auto px-2 sm:px-4">
          <Link
            to="/"
            className="flex items-center font-inter font-normal text-base text-primary hover:text-primary/80"
          >
            <ChevronLeft size={20} className="mr-1" />
            Back to Home
          </Link>
          <h1 className="mt-4 text-2xl font-inter font-bold text-text-primary sm:text-3xl">
            {searchTerm ? 'Search results' : 'Catalog'}
          </h1>
          <p className="mt-2 font-inter text-sm font-normal text-text-secondary sm:text-base">
            {searchTerm
              ? `Showing catalog items matching "${searchTerm}"`
              : filterCategoryName
                ? `Showing catalog items in ${filterCategoryName}`
                : 'Premium products and services, trending offers, and recommendations by category and city.'}
          </p>
        </div>
      </div>

      <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-card px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setShowFilters(true)}
          className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm font-medium text-text-primary hover:bg-muted"
        >
          <SlidersHorizontal size={16} />
          Filters
        </button>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={() => onResetFiltersClick()}
            className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-primary hover:bg-muted"
            aria-label="Reset filters"
          >
            <span className="inline-flex items-center gap-1.5">
              <RotateCcw size={16} className="shrink-0" aria-hidden />
              Reset
            </span>
          </button>
        ) : null}
      </div>

      {showFilters ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
          <div className="absolute bottom-0 left-0 top-0 w-[min(100vw-2rem,24rem)] max-w-[85vw] overflow-y-auto bg-background shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background p-4">
              <span className="font-inter text-lg font-semibold text-text-primary">Filters</span>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="rounded-md p-1 hover:bg-muted"
                aria-label="Close filters"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>
            <div className="p-3 sm:p-4">
              <FiltersSection
                radioGroupId="catalog-mobile-drawer"
                layout="drawer"
                {...filtersSectionProps}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="container mx-auto flex min-w-0 flex-col gap-6 px-3 py-4 sm:px-4 sm:py-6 lg:flex-row lg:px-4 lg:py-8">
        <aside className="hidden w-full shrink-0 space-y-3 lg:block lg:w-1/4 xl:w-1/5">
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => onResetFiltersClick()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-text-primary shadow-sm hover:bg-muted"
            >
              <RotateCcw size={16} className="shrink-0" aria-hidden />
              Reset filters
            </button>
          ) : null}
          <FiltersSection
            radioGroupId="catalog-desktop-sidebar"
            {...filtersSectionProps}
          />
        </aside>

        <div className="min-w-0 w-full lg:w-3/4 xl:w-4/5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {(
              [
                ['all', 'All'],
                ['service', 'Services'],
                ['product', 'Products'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={typeFilter === key}
                onClick={() => handleTypeChange(key)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  typeFilter === key
                    ? 'border-ink bg-ink text-white'
                    : 'border-border bg-card text-text-secondary hover:bg-muted',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mb-4 flex items-center justify-between gap-2 text-sm text-text-secondary">
            <span>{totalCount} items</span>
            {feedQuery.isFetching ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          </div>

          {itemsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : feedQuery.isError ? (
            <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-text-secondary">
              <p>Could not load the catalog feed.</p>
              <button
                type="button"
                onClick={() => void feedQuery.refetch()}
                className="mt-3 font-medium text-primary underline-offset-2 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-border bg-card px-4 py-12 text-center">
              <p className="text-base font-medium text-text-primary">No catalog items match these filters.</p>
              <p className="mt-2 text-sm text-text-secondary">
                Try another category or location, or browse businesses.
              </p>
              <Link
                to="/filters"
                className="mt-4 inline-flex text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                Browse businesses
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                      <BusinessCatalogImage src={item.imageUrl} alt={item.name} className="rounded-none" fit="cover" />
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
                  </div>
                  <div className="flex flex-1 flex-col px-3 py-3">
                    <p className="line-clamp-1 text-[11px] font-medium uppercase tracking-wide text-stat-muted">
                      {item.businessName}
                      {item.categoryName ? ` · ${item.categoryName}` : ''}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-ink">{item.name}</h3>
                    {item.description ? (
                      <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-stat-muted">
                        {item.description}
                      </p>
                    ) : null}
                    <div className="mt-2 flex items-end justify-between gap-2">
                      <p className="line-clamp-1 font-heading text-[15px] font-bold text-ink">
                        {formatCatalogPrice(item)}
                      </p>
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

          <div ref={loadMoreRef} className="flex min-h-12 items-center justify-center py-4">
            {feedQuery.isFetchingNextPage ? (
              <Loader2 className="size-6 animate-spin text-primary" aria-label="Loading more catalog items" />
            ) : null}
          </div>
        </div>
      </div>

      {selectedItem ? (
        <CatalogItemDetailSheet
          open={detailOpen}
          item={selectedItem}
          businessInfoId={selectedItem.businessInfoId}
          businessName={selectedItem.businessName}
          vendorUserUuid={selectedItem.vendorUserUuid}
          fromPath="/catalog"
          showMessageBusiness
          messagesPath="/messages"
          onClose={closeDetail}
        />
      ) : null}
    </div>
  )
}
