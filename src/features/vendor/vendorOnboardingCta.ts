import type { NavigateFunction } from "react-router-dom";

import { hasAnyRole } from "@/auth/roles";
import type { AuthUser } from "@/auth/types";
import {
  ensureCanStartVendorSignup,
  isLoggedInCustomerOnly,
} from "./vendorSignupFromCustomerGuard";

export type VendorOnboardingGuestDestination = "trade-plans" | "vendor-register";
export type VendorOnboardingVendorDestination = "dashboard" | "choose-plan";

export type VendorOnboardingCtaOptions = {
  user: AuthUser | null;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  navigate: NavigateFunction;
  guestDestination?: VendorOnboardingGuestDestination;
  vendorDestination?: VendorOnboardingVendorDestination;
  /** On the trade page, scroll to plans instead of routing away. */
  scrollToPlans?: () => void;
};

/**
 * Vendor signup CTAs used on Trade, Business Tips, and similar pages.
 * - Customer account → logout prompt (no user dashboard redirect).
 * - Vendor → dashboard or choose-your-plan.
 * - Guest → trade plans or vendor registration.
 */
export async function handleVendorOnboardingCta(
  options: VendorOnboardingCtaOptions,
): Promise<void> {
  const {
    user,
    logout,
    isAuthenticated,
    navigate,
    guestDestination = "trade-plans",
    vendorDestination = "dashboard",
    scrollToPlans,
  } = options;

  if (isAuthenticated && isLoggedInCustomerOnly(user)) {
    await ensureCanStartVendorSignup(user, logout);
    return;
  }

  if (isAuthenticated && user && hasAnyRole(user, "vendor")) {
    navigate(
      vendorDestination === "choose-plan"
        ? "/vendor/choose-your-plan"
        : "/vendor/dashboard",
    );
    return;
  }

  if (scrollToPlans) {
    scrollToPlans();
    return;
  }

  if (guestDestination === "vendor-register") {
    navigate("/register?role=vendor");
    return;
  }

  navigate("/trade#choose-your-plan");
}
