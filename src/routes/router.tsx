import { createBrowserRouter } from 'react-router-dom'

import { appRoutes } from '@/routes/appRoutes'

export function createAppRouter(hydrationData?: unknown) {
  return createBrowserRouter(appRoutes, {
    hydrationData: hydrationData as never,
  })
}
