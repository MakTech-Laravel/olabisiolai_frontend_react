import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '@/auth/useAuth'

export function RequireRole({
  role,
  children,
}: {
  role: string
  children: React.ReactNode
}) {
  const { isAuthenticated, isSessionLoading, user } = useAuth()
  const location = useLocation()

  if (isSessionLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  const roles = user?.roles ?? []
  if (!roles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return children
}
