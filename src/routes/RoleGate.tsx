import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/auth/useAuth";
import { getRoleFallback } from "@/auth/rolePolicy";
import { hasAnyRole } from "@/auth/roles";

export function RoleGate({
  allow,
  fallback,
  unauthenticatedTo = "/login",
  children,
}: {
  allow: string | string[];
  fallback?: string;
  /** Where to send users who are not logged in. */
  unauthenticatedTo?: string;
  children: React.ReactNode;
}) {
  const { isAuthenticated, isSessionLoading, isUserLoading, user } = useAuth();
  const location = useLocation();

  if (isSessionLoading || isUserLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate to={unauthenticatedTo} replace state={{ from: location }} />
    );
  }

  if (!hasAnyRole(user, allow)) {
    const userRole = (user as { role?: string } | null)?.role;
    const resolvedFallback =
      fallback ??
      (userRole ? getRoleFallback(userRole) : undefined) ??
      "/unauthorized";
    return <Navigate to={resolvedFallback} replace />;
  }

  return children;
}
