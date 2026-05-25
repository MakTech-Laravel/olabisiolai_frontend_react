import type { QueryClient } from "@tanstack/react-query";

import type { VendorOnboardingStatus } from "@/features/subscription/vendorOnboardingApi";
import type { VendorSubscriptionState } from "@/features/subscription/vendorSubscriptionApi";

/** Apply subscription state to React Query immediately so guards allow instant dashboard access. */
export function primeVendorSubscriptionCaches(
  queryClient: QueryClient,
  subscription: VendorSubscriptionState,
): void {
  queryClient.setQueryData(["vendor", "subscription", "status"], { subscription });

  queryClient.setQueryData(["vendor", "onboarding", "status"], (prev: VendorOnboardingStatus | undefined) => ({
    has_business: true,
    can_access_onboarding: prev?.can_access_onboarding ?? false,
    redirect_to: "/vendor/dashboard",
    subscription,
  }));
}
