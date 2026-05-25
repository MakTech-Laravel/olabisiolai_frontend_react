import { useCallback } from "react";
import { useNavigate, type To } from "react-router-dom";

import { useAuth } from "@/auth/useAuth";
import {
  CUSTOMER_LOGIN_PATH,
  type LoginReturnTarget,
} from "@/features/auth/loginReturn";

type RequireAuthNavigateOptions = {
  state?: unknown;
};

function toLoginReturnTarget(
  to: To,
  options?: RequireAuthNavigateOptions,
): LoginReturnTarget {
  if (typeof to === "string") {
    const [pathname, search = ""] = to.split("?");
    return {
      pathname: pathname || "/",
      search: search ? `?${search}` : "",
      state: options?.state,
    };
  }

  const pathTo = to as { pathname?: string; search?: string; state?: unknown };
  return {
    pathname: pathTo.pathname ?? "/",
    search: pathTo.search ?? "",
    state: options?.state ?? pathTo.state,
  };
}

/** Navigate to `to` when authenticated; otherwise open login and return there after sign-in. */
export function useRequireAuthNavigate() {
  const { isAuthenticated, isSessionLoading, isUserLoading } = useAuth();
  const navigate = useNavigate();

  const requireAuthNavigate = useCallback(
    (to: To, options?: RequireAuthNavigateOptions) => {
      if (isSessionLoading || isUserLoading) return;

      if (!isAuthenticated) {
        navigate(CUSTOMER_LOGIN_PATH, {
          state: { from: toLoginReturnTarget(to, options) },
        });
        return;
      }

      navigate(to, options);
    },
    [isAuthenticated, isSessionLoading, isUserLoading, navigate],
  );

  return {
    requireAuthNavigate,
    isAuthReady: !isSessionLoading && !isUserLoading,
    isAuthenticated,
  };
}
