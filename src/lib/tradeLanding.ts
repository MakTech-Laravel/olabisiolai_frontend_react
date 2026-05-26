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
  plan: TradePlanTier,
  isAuthenticated: boolean,
): string {
  if (!isAuthenticated) {
    return "/register?role=vendor";
  }

  return "/vendor/choose-your-plan";
}
