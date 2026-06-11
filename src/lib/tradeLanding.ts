import type { NavigateFunction } from "react-router-dom";

import type { AuthUser } from "@/auth/types";
import { handleVendorOnboardingCta } from "@/features/vendor/vendorOnboardingCta";
import { vendorSignupPlanPath } from "@/features/vendor/vendorPlanStorage";

export const TRADE_CHOOSE_PLAN_SECTION_ID = "choose-your-plan";

export type TradePlanTier = "basic" | "premium";

export function scrollToTradeChoosePlan(): void {
  const el = document.getElementById(TRADE_CHOOSE_PLAN_SECTION_ID);
  if (!el) return;

  el.scrollIntoView({ behavior: "smooth", block: "start" });

  if (typeof window === "undefined") return;

  const hash = `#${TRADE_CHOOSE_PLAN_SECTION_ID}`;
  if (window.location.hash !== hash) {
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}${hash}`,
    );
  }
}

export function storeTradePlanSelection(plan: TradePlanTier): void {
  try {
    localStorage.setItem("vendorPlan", plan === "premium" ? "premium" : "free");
  } catch {
    // ignore storage failures (private mode, etc.)
  }
}

/** Where to send someone who picked a plan on the trade landing page. */
export function tradePlanActionPath(
  _plan: TradePlanTier,
  isAuthenticated: boolean,
): string {
  if (!isAuthenticated) {
    return vendorSignupPlanPath();
  }

  return "/vendor/choose-your-plan";
}

/**
 * Trade page primary CTAs (hero + footer).
 * Guests scroll to plans; logged-in users can proceed to choose a plan; vendors go to onboarding.
 */
export async function handleTradePageVendorCta(options: {
  user: AuthUser | null;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  navigate: NavigateFunction;
}): Promise<void> {
  return handleVendorOnboardingCta({
    ...options,
    vendorDestination: "choose-plan",
    scrollToPlans: scrollToTradeChoosePlan,
  });
}
