import { Navigate, useLocation } from 'react-router-dom'

import { rolePolicy } from '@/auth/rolePolicy'
import { getUserRoles, hasAnyRole } from '@/auth/roles'
import { useAuth } from '@/auth/useAuth'
import { env } from '@/config/env'

const AUTHENTICATED_LOGIN_REDIRECT = '/user/profile'

/**
 * GuestGate protects guest-only pages (login/fallback pages).
 *
 * Rules:
 * - If not authenticated: render children.
 * - If authenticated:
 *   - loginMode=single: redirect to user's recommended dashboard.
 *   - loginMode=multi: redirect only if `roleScope` matches user's role(s); otherwise allow viewing the page.
 */
export function GuestGate({
  roleScope,
  redirectTo,
  children,
}: {
  /** If set, only users with these roles get redirected away in multi-login mode. */
  roleScope?: string | string[]
  /** Optional override for where to send authenticated users. */
  redirectTo?: string
  children: React.ReactNode
}) {
  const { isAuthenticated, isSessionLoading, isUserLoading, user } = useAuth()
  const location = useLocation()

  if (isSessionLoading || isUserLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!isAuthenticated) return children

  const isRegisterOtpPage =
    location.pathname === '/otp-verification' &&
    new URLSearchParams(location.search).get('purpose') === 'register'
  if (isRegisterOtpPage) return children

  const roles = getUserRoles(user)

  if (roles.includes('admin')) {
    const adminHome = redirectTo ?? rolePolicy.admin?.dashboard ?? '/admin'
    if (env.loginMode === 'single') {
      return <Navigate to={adminHome} replace />
    }
    if (roleScope && hasAnyRole(user, roleScope)) {
      return <Navigate to={adminHome} replace />
    }
    return children
  }

  const recommended = redirectTo ?? AUTHENTICATED_LOGIN_REDIRECT

  if (env.loginMode === 'single') {
    return <Navigate to={recommended} replace />
  }

  // multi login mode: only redirect away if this is the user's own role login page
  if (!roleScope) return children
  if (!hasAnyRole(user, roleScope)) return children
  return <Navigate to={recommended} replace />
}
