import { Navigate } from "react-router-dom";

import { useAuth } from "@/auth/useAuth";

/**
 * Picks the first user-management tab the admin is allowed to see
 * (matches sidebar visibility).
 */
export function AdminUserManagementIndexRedirect() {
  const { can, isSessionLoading, isUserLoading } = useAuth();

  if (isSessionLoading || isUserLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (can("view roles")) {
    return <Navigate to="/admin/user-management/roles" replace />;
  }
  if (can("view admins")) {
    return <Navigate to="/admin/user-management/admin" replace />;
  }
  return <Navigate to="/admin/user-management/user" replace />;
}
