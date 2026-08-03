import { Outlet, useLocation } from 'react-router-dom'

import { CatalogFloatingCartFab } from '@/components/business/CatalogFloatingCartFab'
import { FrontendFooter } from '@/components/partials/frontend/FrontendFooter'
import { FrontendHeader } from '@/components/partials/frontend/FrontendHeader'
import { DocumentHead } from '@/components/seo/DocumentHead'

const FOOTERLESS_PATHS = new Set(['/filters', '/cart'])

export function FrontendLayout() {
  const { pathname } = useLocation()
  const hideFooter =
    FOOTERLESS_PATHS.has(pathname) ||
    pathname.startsWith('/catalog/items/') ||
    pathname.startsWith('/cart')

  return (
    <div className="min-h-dvh bg-background">
      <DocumentHead />
      <FrontendHeader />
      <main className="mx-auto w-full">
        <Outlet />
      </main>
      {!hideFooter ? <FrontendFooter /> : null}
      <CatalogFloatingCartFab />
    </div>
  )
}
