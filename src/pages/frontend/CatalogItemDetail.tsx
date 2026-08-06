import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'

import { CatalogItemDetailContent } from '@/components/business/CatalogItemDetailContent'
import {
  fetchCatalogDiscoveryItem,
  type DiscoveryCatalogItem,
} from '@/features/catalog/publicCatalogDiscoveryApi'
import type { BusinessCatalogItem } from '@/features/catalog/businessCatalogApi'
import { cn } from '@/lib/utils'

type LocationState = {
  from?: string
  item?: DiscoveryCatalogItem | BusinessCatalogItem
  businessInfoId?: number
  businessName?: string
  vendorUserUuid?: string | null
  messagesPath?: '/messages' | '/user/messages'
  showMessageBusiness?: boolean
  enableCatalogCart?: boolean
}

export default function CatalogItemDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { itemId: itemIdParam } = useParams<{ itemId: string }>()
  const itemId = Number(itemIdParam)
  const state = (location.state ?? {}) as LocationState

  const fromPath = state.from || '/catalog'
  const messagesPath = state.messagesPath ?? '/messages'
  const showMessageBusiness = state.showMessageBusiness !== false

  const itemQuery = useQuery({
    queryKey: ['catalog', 'item', itemId],
    queryFn: () => fetchCatalogDiscoveryItem(itemId),
    enabled: Number.isFinite(itemId) && itemId > 0,
    staleTime: 60_000,
    retry: 1,
  })

  const resolved = useMemo(() => {
    if (itemQuery.data) {
      return {
        item: itemQuery.data as BusinessCatalogItem,
        businessInfoId: itemQuery.data.businessInfoId,
        businessName: itemQuery.data.businessName,
        vendorUserUuid: itemQuery.data.vendorUserUuid,
        enableCatalogCart: itemQuery.data.isPremium,
      }
    }

    if (state.item && state.businessInfoId) {
      const fromDiscovery =
        'isPremium' in state.item ? Boolean(state.item.isPremium) : state.enableCatalogCart === true
      return {
        item: state.item,
        businessInfoId: state.businessInfoId,
        businessName: state.businessName || 'Business',
        vendorUserUuid: state.vendorUserUuid ?? null,
        enableCatalogCart: state.enableCatalogCart ?? fromDiscovery,
      }
    }

    return null
  }, [
    itemQuery.data,
    state.item,
    state.businessInfoId,
    state.businessName,
    state.vendorUserUuid,
    state.enableCatalogCart,
  ])

  // Prefer native document scroll on mobile (smoother than nested overflow containers).
  useEffect(() => {
    const root = document.documentElement
    const prev = root.style.scrollBehavior
    root.style.scrollBehavior = 'smooth'
    return () => {
      root.style.scrollBehavior = prev
    }
  }, [])

  const onBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(fromPath)
  }

  if (!Number.isFinite(itemId) || itemId <= 0) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <p className="text-sm text-body-secondary">This catalog item link is invalid.</p>
        <Link to="/catalog" className="text-sm font-semibold text-primary hover:underline">
          Back to Catalog
        </Link>
      </div>
    )
  }

  if (!resolved && itemQuery.isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" aria-label="Loading details" />
      </div>
    )
  }

  if (!resolved) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <p className="text-sm text-body-secondary">Catalog item not found.</p>
        <Link to="/catalog" className="text-sm font-semibold text-primary hover:underline">
          Back to Catalog
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="hidden border-b border-border bg-card px-4 py-4 sm:px-6 lg:block">
        <div className="container mx-auto px-2 sm:px-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center font-inter text-base font-normal text-primary transition-colors hover:text-primary/80"
          >
            <ChevronLeft size={20} className="mr-1" aria-hidden />
            Back
          </button>
          <h1 className="mt-3 font-inter text-2xl font-bold text-text-primary sm:text-3xl">
            {resolved.item.name}
          </h1>
          <p className="mt-1 font-inter text-sm text-text-secondary sm:text-base">
            {resolved.businessName}
            {resolved.item.type ? ` · ${resolved.item.type}` : ''}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-0 py-0 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
        <div
          className={cn(
            'mx-auto w-full overflow-hidden bg-auth-bg',
            'sm:rounded-2xl sm:border sm:border-border-light sm:shadow-sm',
          )}
        >
          <CatalogItemDetailContent
            item={resolved.item}
            businessInfoId={resolved.businessInfoId}
            businessName={resolved.businessName}
            vendorUserUuid={resolved.vendorUserUuid}
            fromPath={fromPath}
            showMessageBusiness={showMessageBusiness}
            enableCatalogCart={resolved.enableCatalogCart && showMessageBusiness}
            messagesPath={messagesPath}
            onBack={onBack}
          />
        </div>
      </div>
    </div>
  )
}
