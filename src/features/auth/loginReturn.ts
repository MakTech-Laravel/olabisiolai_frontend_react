import type { Location } from "react-router-dom";

/** Where to send the user after a successful customer login. */
export type LoginReturnTarget = Pick<
  Location,
  "pathname" | "search" | "state"
>;

export function isUnsafePostLoginPath(pathname: string | undefined): boolean {
  if (!pathname) return true;
  return (
    pathname === "/unauthorized" ||
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname.startsWith("/otp-verification")
  );
}

export function loginReturnFromLocation(location: Location): LoginReturnTarget {
  return {
    pathname: location.pathname,
    search: location.search,
    state: location.state,
  };
}

export const CUSTOMER_LOGIN_PATH = "/login/email?role=user";
