import type { NavigateFunction } from "react-router-dom";

import {
  shouldHonorLoginReturn,
  type LoginReturnTarget,
} from "@/features/auth/loginReturn";

export function navigateAfterLogin(
  navigate: NavigateFunction,
  returnTo: LoginReturnTarget | undefined,
): boolean {
  if (!shouldHonorLoginReturn(returnTo) || !returnTo?.pathname) {
    return false;
  }

  navigate(
    {
      pathname: returnTo.pathname,
      search: returnTo.search ?? "",
    },
    {
      replace: true,
      state: returnTo.state,
    },
  );

  return true;
}
