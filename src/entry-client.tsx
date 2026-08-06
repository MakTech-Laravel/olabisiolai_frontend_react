import { StrictMode, useMemo } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { HydrationBoundary, QueryClientProvider, type DehydratedState } from '@tanstack/react-query'

import 'sweetalert2/dist/sweetalert2.min.css'
import './index.css'

import { AuthProvider } from '@/auth/AuthProvider'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { useFavicon } from '@/hooks/useFavicon'
import { queryClient } from '@/lib/queryClient'
import { EchoProvider } from '@/providers/EchoProvider'
import { createAppRouter } from '@/routes/router'

declare global {
  interface Window {
    __STATIC_ROUTER_HYDRATION_DATA__?: unknown
    __REACT_QUERY_STATE__?: unknown
  }
}

function ClientApp({ hydrationData }: { hydrationData?: unknown }) {
  useFavicon({
    apiUrl: import.meta.env.VITE_FAVICON_API_URL as string | undefined,
    responsePath: (import.meta.env.VITE_FAVICON_RESPONSE_PATH as string | undefined) ?? 'data.favicon',
    ttlMs: Number(import.meta.env.VITE_FAVICON_CACHE_TTL_MS || 0) || undefined,
  })

  const router = useMemo(() => createAppRouter(hydrationData), [hydrationData])

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={window.__REACT_QUERY_STATE__ as DehydratedState | undefined}>
        <AuthProvider>
          <EchoProvider>
            <ErrorBoundary>
              <RouterProvider router={router} />
            </ErrorBoundary>
          </EchoProvider>
        </AuthProvider>
      </HydrationBoundary>
    </QueryClientProvider>
  )
}

const rootEl = document.getElementById('root')
if (rootEl) {
  const hasSsrMarkup =
    rootEl.childNodes.length > 0 &&
    !(rootEl.childNodes.length === 1 && rootEl.textContent?.includes('ssr-outlet'))

  const app = (
    <StrictMode>
      <ClientApp hydrationData={window.__STATIC_ROUTER_HYDRATION_DATA__} />
    </StrictMode>
  )

  if (hasSsrMarkup) {
    hydrateRoot(rootEl, app)
  } else {
    rootEl.innerHTML = ''
    createRoot(rootEl).render(app)
  }
}
