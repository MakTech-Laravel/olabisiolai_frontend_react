import type { NavigateFunction } from "react-router-dom";

import { hasAnyRole } from "@/auth/roles";
import type { AuthUser } from "@/auth/types";

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
 * - Logged-in customer account → choose a plan (no logout friction; no user dashboard redirect).
 * - Vendor → dashboard or choose-your-plan.
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
    navigate(
      vendorDestination === "choose-plan"
        ? "/vendor/choose-your-plan"
        : "/vendor/dashboard",
    );
    return;
  }

  // When a page provides an in-place scroll target (e.g. the Trade landing page),
  // prefer scrolling over routing. This avoids "URL changed but page didn't move"
  // and keeps the experience frictionless for guests and logged-in users.
  if (scrollToPlans) {
    scrollToPlans();
    return;
  }

  if (isAuthenticated) {
    navigate("/vendor/choose-your-plan");
    return;
  }

  if (guestDestination === "vendor-register") {
    navigate("/register?role=vendor");
    return;
  }

  navigate("/trade#choose-your-plan");
}
