import type { BoostRenewType } from "@/features/boost/vendorBoostApi";

export type BoostCheckoutSelection = {
  locationId: string;
  locationLabel: string;
  tierKey: string;
  tierLabel: string;
  durationDays: number;
  amount: number;
  renewType?: BoostRenewType;
  sourceCampaignId?: number;
  paymentId?: number;
  requestId?: number;
  /** True when boost was explicitly chosen to bundle with premium checkout (signup or upgrade). */
  bundledWithPremium?: boolean;
};

const BOOST_CHECKOUT_KEY = "vendorBoostCheckout";
export const BOOST_PAYMENT_SOURCE_KEY = "paymentSource";

export function saveBoostCheckoutSelection(
  selection: BoostCheckoutSelection,
  options?: { standalonePayment?: boolean; bundledWithPremium?: boolean },
): void {
  const payload: BoostCheckoutSelection = {
    ...selection,
    bundledWithPremium: options?.bundledWithPremium === true,
  };
  sessionStorage.setItem(BOOST_CHECKOUT_KEY, JSON.stringify(payload));
  if (options?.standalonePayment) {
    sessionStorage.setItem(BOOST_PAYMENT_SOURCE_KEY, "boost");
  } else if (options?.bundledWithPremium) {
    sessionStorage.removeItem(BOOST_PAYMENT_SOURCE_KEY);
  }
}

export function readBoostCheckoutSelection(): BoostCheckoutSelection | null {
  try {
    const raw = sessionStorage.getItem(BOOST_CHECKOUT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BoostCheckoutSelection;
    if (!parsed?.tierKey || !parsed?.durationDays) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Boost add-on for premium checkout only — ignores stale standalone boost sessions. */
export function readPremiumBundledBoostSelection(): BoostCheckoutSelection | null {
  const selection = readBoostCheckoutSelection();
  if (!selection?.bundledWithPremium) {
    return null;
  }
  return selection;
}

export function clearBoostCheckoutSelection(): void {
  sessionStorage.removeItem(BOOST_CHECKOUT_KEY);
  sessionStorage.removeItem(BOOST_PAYMENT_SOURCE_KEY);
}

export function isBoostPaymentCheckout(): boolean {
  return sessionStorage.getItem(BOOST_PAYMENT_SOURCE_KEY) === "boost";
}
