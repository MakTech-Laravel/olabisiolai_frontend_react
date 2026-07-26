import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { BusinessCatalogSection } from '@/components/business/BusinessCatalogSection'
import { fetchPublicBusinessById } from '@/features/business/publicBusinessApi'
import { resolveBusinessIdFromSlug } from '@/lib/encryptId'
import { businessProfilePath } from '@/lib/businessProfile'

export default function BusinessCatalogBrowsePage() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const businessId = resolveBusinessIdFromSlug(slug ?? '')

  const businessQuery = useQuery({
    queryKey: ['business', businessId, 'catalog-browse'],
    queryFn: () => fetchPublicBusinessById(businessId!),
    enabled: businessId != null && businessId > 0,
    staleTime: 60_000,
  })

  const business = businessQuery.data
  const profilePath = businessId ? businessProfilePath(businessId) : '/catalog'

  if (!businessId) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <p className="text-sm text-body-secondary">This catalog link is invalid.</p>
        <Link to="/catalog" className="text-sm font-semibold text-primary hover:underline">
          Back to Catalog
        </Link>
      </div>
    )
  }

  if (businessQuery.isPending && !business) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" aria-label="Loading catalog" />
      </div>
    )
  }

  if (!business || business.catalogLocked) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <p className="text-sm text-body-secondary">
          {business?.catalogLocked
            ? 'This business catalog is not available.'
            : 'Business not found.'}
        </p>
        <Link to={profilePath} className="text-sm font-semibold text-primary hover:underline">
          Back to business
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-auth-bg pb-8">
      <header className="sticky top-0 z-20 border-b border-border-light bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <button
            type="button"
            aria-label="Back to business"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1)
                return
              }
              navigate(profilePath)
            }}
            className="grid size-10 place-items-center rounded-full transition-colors hover:bg-auth-bg"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-heading text-lg font-bold text-ink">Catalog</h1>
            <p className="truncate text-xs text-stat-muted">{business.name}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <BusinessCatalogSection
          items={business.catalogItems}
          catalogLocked={false}
          businessId={business.id}
          businessName={business.name}
          vendorUserUuid={business.vendorUserUuid}
          fromPath={window.location.pathname}
          showMessageBusiness
          messagesPath="/messages"
          previewLimit={null}
        />
      </div>
    </div>
  )
}
