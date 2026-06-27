import type { NavigateFunction } from "react-router-dom";

import { hasAnyRole } from "@/auth/roles";
import type { AuthUser } from "@/auth/types";
import {
  fetchVendorOnboardingStatus,
  onboardingRedirectPath,
} from "@/features/subscription/vendorOnboardingApi";
import { vendorSignupPlanPath } from "@/features/vendor/vendorPlanStorage";

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
 * - Logged-in customer account → unified profile hub or choose plan.
 * - Vendor → business profile, dashboard, or choose-your-plan.
 * - Guest → trade plans or vendor registration.
 */
export async function handleVendorOnboardingCta(
  options: VendorOnboardingCtaOptions,
): Promise<void> {
  const {
    user,
    logout: _logout,
    isAuthenticated,
    navigate,
    guestDestination = "trade-plans",
    vendorDestination = "dashboard",
    scrollToPlans,
  } = options;

  if (isAuthenticated && user && hasAnyRole(user, "vendor")) {
    if (vendorDestination === "choose-plan") {
      navigate("/vendor/choose-your-plan");
      return;
    }

    const status = await fetchVendorOnboardingStatus();
    navigate(onboardingRedirectPath(status));
    return;
  }

  if (scrollToPlans) {
    scrollToPlans();
    return;
  }

  if (isAuthenticated) {
    navigate("/user/profile");
    return;
  }

  if (guestDestination === "vendor-register") {
    navigate(vendorSignupPlanPath());
    return;
  }

  navigate("/vendor/choose-your-plan");
}
