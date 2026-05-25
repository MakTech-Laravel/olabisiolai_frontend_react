import { Outlet } from 'react-router-dom'

import { FrontendFooter } from '@/components/partials/frontend/FrontendFooter'
import { FrontendHeader } from '@/components/partials/frontend/FrontendHeader'

export function AuthLayout({
  showHeader = true,
  showFooter = true,
}: {
  showHeader?: boolean
  showFooter?: boolean
}) {
  return (
    <div className="min-h-dvh bg-auth-bg">
      {showHeader ? <FrontendHeader /> : null}
      <main className="mx-auto flex w-full container flex-1 items-center justify-center px-4 py-12 ">
        <Outlet />
      </main>
      {showFooter ? <FrontendFooter /> : null}
    </div>
  )
}

