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
 * Blocks vendor plan CTAs for logged-in customers. Shows a clear popup and optional logout.
 * @returns `true` when the caller may continue (guest or vendor); `false` when blocked.
 */
export async function ensureCanStartVendorSignup(
  user: AuthUser | null,
  logout: () => Promise<void>,
): Promise<boolean> {
  if (!isLoggedInCustomerOnly(user)) {
    return true;
  }

  const confirmed = await alert.confirm({
    title: "Log out to create a vendor account",
    html: `
      <p>You are currently signed in with a <strong>customer account</strong>.</p>
      <p class="mt-3 text-sm leading-relaxed">
        Vendor registration on Gidira uses a separate business account. To list your business,
        please log out of your customer profile first, then register or sign in as a vendor.
      </p>
      <p class="mt-3 text-sm leading-relaxed text-slate-600">
        Your saved favorites and messages will stay on your customer account.
      </p>
    `,
    icon: "info",
    confirmText: "Log out",
    cancelText: "Stay signed in",
  });

  if (confirmed) {
    await logout();
  }

  return false;
}
