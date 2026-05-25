import { RouterProvider } from 'react-router-dom'

import { useFavicon } from '@/hooks/useFavicon'
import { router } from '@/routes/router'

export function AppBootstrap() {
  useFavicon({
    apiUrl: import.meta.env.VITE_FAVICON_API_URL as string | undefined,
    responsePath: (import.meta.env.VITE_FAVICON_RESPONSE_PATH as string | undefined) ?? 'data.favicon',
    ttlMs: Number(import.meta.env.VITE_FAVICON_CACHE_TTL_MS || 0) || undefined,
  })
  return <RouterProvider router={router} />
}

