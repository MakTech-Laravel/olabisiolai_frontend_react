import type { QueryClient } from '@tanstack/react-query'

import { cmsConfigByType, type CmsPageType } from '@/features/cms/cmsConfig'
import { fetchPublicCmsPage } from '@/features/cms/publicCmsApi'
import { fetchPublicBusinessById } from '@/features/business/publicBusinessApi'
import { fetchCatalogDiscoveryItem } from '@/features/catalog/publicCatalogDiscoveryApi'
import { fetchResolvedSeo } from '@/features/seo/publicSeoApi'
import { resolveBusinessIdFromSlug } from '@/lib/encryptId'
import { normalizeRequestPath } from '@/ssr/publicPaths'

const CMS_BY_PATH: Record<string, CmsPageType> = {
  '/about': 'about_us',
  '/privacy-policy': 'privacy_policy',
  '/terms': 'terms_and_conditions',
}

/**
 * Prefetch React Query caches used by public SSR pages so hydrate matches.
 */
export async function prefetchPublicRouteData(
  queryClient: QueryClient,
  pathname: string,
): Promise<void> {
  const path = normalizeRequestPath(pathname)

  const tasks: Promise<unknown>[] = [
    queryClient.prefetchQuery({
      queryKey: ['public', 'seo', 'resolve', path],
      queryFn: () => fetchResolvedSeo(path),
      staleTime: 5 * 60_000,
    }),
  ]

  const cmsType = CMS_BY_PATH[path]
  if (cmsType) {
    const config = cmsConfigByType(cmsType)
    tasks.push(
      queryClient.prefetchQuery({
        queryKey: ['public', 'cms', config.type],
        queryFn: () => fetchPublicCmsPage(config),
        staleTime: 5 * 60_000,
      }),
    )
  }

  const businessMatch = path.match(/^\/businesses\/([^/]+)(?:\/(catalog|reviews))?$/)
  if (businessMatch?.[1]) {
    const businessId = resolveBusinessIdFromSlug(decodeURIComponent(businessMatch[1]))
    if (businessId !== null) {
      tasks.push(
        queryClient.prefetchQuery({
          queryKey: ['business', businessId],
          queryFn: () => fetchPublicBusinessById(businessId),
          staleTime: 5 * 60_000,
        }),
      )
    }
  }

  const catalogItemMatch = path.match(/^\/catalog\/items\/(\d+)$/)
  if (catalogItemMatch?.[1]) {
    const itemId = Number(catalogItemMatch[1])
    if (Number.isFinite(itemId) && itemId > 0) {
      tasks.push(
        queryClient.prefetchQuery({
          queryKey: ['catalog', 'item', itemId],
          queryFn: () => fetchCatalogDiscoveryItem(itemId),
          staleTime: 60_000,
        }),
      )
    }
  }

  await Promise.allSettled(tasks)
}
