import { Navigate } from "react-router-dom";

import { useAuth } from "@/auth/useAuth";

/**
 * Fine-grained guard for Spatie admin permissions / roles (after `RoleGate allow="admin"`).
 */
export function PermissionGate({
  permission = null,
  role = null,
  fallback = "/unauthorized",
  children,
}: {
  permission?: string | null;
  role?: string | null;
  fallback?: string;
  children: React.ReactNode;
}) {
  const { isSessionLoading, isUserLoading, can, hasRole } = useAuth();

  if (isSessionLoading || isUserLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (permission && !can(permission)) {
    return <Navigate to={fallback} replace />;
  }

  if (role && !hasRole(role)) {
    return <Navigate to={fallback} replace />;
  }

  return children;
}
