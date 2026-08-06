import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from 'react-router-dom'
import { dehydrate, HydrationBoundary, QueryClientProvider } from '@tanstack/react-query'

import { AuthProvider } from '@/auth/AuthProvider'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import type { ResolvedSeoDto } from '@/features/seo/types'
import { appRoutes } from '@/routes/appRoutes'
import { createSsrQueryClient } from '@/ssr/createQueryClient'
import { prefetchPublicRouteData } from '@/ssr/prefetch'
import { shouldSsrPath } from '@/ssr/publicPaths'
import { renderAppToHtml } from '@/ssr/renderToHtml'
import { buildSeoHeadHtml, fetchSeoForPath } from '@/ssr/seoHead'

export { shouldSsrPath }

export type SsrRenderResult = {
  appHtml: string
  dehydratedState: unknown
  routerState: unknown
  seo: ResolvedSeoDto | null
  seoHeadHtml: string
  status: number
  redirectTo?: string
}

const handler = createStaticHandler(appRoutes)

/**
 * Server-render a public path to HTML + dehydrated React Query state.
 */
export async function render(url: string): Promise<SsrRenderResult> {
  const origin = 'http://ssr.local'
  const request = new Request(new URL(url, origin))
  const context = await handler.query(request)

  if (context instanceof Response) {
    const location = context.headers.get('Location') ?? '/'
    return {
      appHtml: '',
      dehydratedState: null,
      routerState: null,
      seo: null,
      seoHeadHtml: buildSeoHeadHtml(null),
      status: context.status,
      redirectTo: location,
    }
  }

  const pathname = new URL(url, origin).pathname
  const queryClient = createSsrQueryClient()
  const [seo] = await Promise.all([
    fetchSeoForPath(pathname),
    prefetchPublicRouteData(queryClient, pathname),
  ])

  const router = createStaticRouter(handler.dataRoutes, context)
  const dehydratedState = dehydrate(queryClient)

  const appHtml = await renderAppToHtml(
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        <AuthProvider>
          <ErrorBoundary>
            <StaticRouterProvider router={router} context={context} />
          </ErrorBoundary>
        </AuthProvider>
      </HydrationBoundary>
    </QueryClientProvider>,
  )

  queryClient.clear()

  return {
    appHtml,
    dehydratedState,
    routerState: context,
    seo,
    seoHeadHtml: buildSeoHeadHtml(seo),
    status: context.statusCode ?? 200,
  }
}
