import { getUserRoles } from "@/auth/roles";
import type { AuthUser } from "@/auth/types";
import { alert } from "@/lib/sweetAlert";

/** True when signed in as a customer (user) but not as a vendor or admin. */
export function isLoggedInCustomerOnly(user: AuthUser | null): boolean {
  if (!user) return false;

  const roles = getUserRoles(user);
  if (roles.includes("vendor") || roles.includes("admin")) return false;

  return roles.includes("user") || user.role === "user";
}

/**
 * Previously blocked vendor onboarding CTAs for logged-in customers.
 * Product decision: customers should be able to choose a plan and continue
 * into vendor onboarding without logging out.
 *
 * @returns `true` when the caller may continue.
 */
export async function ensureCanStartVendorSignup(
  user: AuthUser | null,
  _logout: () => Promise<void>,
): Promise<boolean> {
  if (!isLoggedInCustomerOnly(user)) {
    return true;
  }

  alert.toast.info("Choose a plan to start listing your business.");
  return true;
}
