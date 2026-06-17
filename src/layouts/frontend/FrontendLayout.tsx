import { Outlet, useLocation } from 'react-router-dom'

import { FrontendFooter } from '@/components/partials/frontend/FrontendFooter'
import { FrontendHeader } from '@/components/partials/frontend/FrontendHeader'

const FOOTERLESS_PATHS = new Set(['/filters'])

export function FrontendLayout() {
  const { pathname } = useLocation()
  const hideFooter = FOOTERLESS_PATHS.has(pathname)

  return (
    <div className="min-h-dvh bg-background">
      <FrontendHeader />
      <main className="mx-auto w-full">
        <Outlet />
      </main>
      {!hideFooter ? <FrontendFooter /> : null}
    </div>
  )
}

