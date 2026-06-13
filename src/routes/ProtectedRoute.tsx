import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '@/auth/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSessionLoading, isUserLoading } = useAuth()
  const location = useLocation()

  if (isSessionLoading || isUserLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
