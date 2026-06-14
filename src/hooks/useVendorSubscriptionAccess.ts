import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getAccessToken } from "@/auth/token";
import { fetchVendorOnboardingStatus, onboardingRedirectPath } from "@/features/subscription/vendorOnboardingApi";
import { fetchSubscriptionStatus } from "@/features/subscription/vendorSubscriptionApi";

export const VENDOR_PREMIUM_PAYMENT_PATH = "/vendor/premium-payment";

/** Routes that show a preview + “Get Premium” CTA instead of forcing checkout. */
export const VENDOR_PREMIUM_PREVIEW_PATHS = ["/vendor/boost", "/vendor/analytics"] as const;

export function isVendorPremiumPreviewPath(pathname: string): boolean {
  return VENDOR_PREMIUM_PREVIEW_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function useVendorSubscriptionAccess() {
  const navigate = useNavigate();
  const hasToken = Boolean(getAccessToken());

  const onboardingQuery = useQuery({
    queryKey: ["vendor", "onboarding", "status"],
    queryFn: fetchVendorOnboardingStatus,
    enabled: hasToken,
    staleTime: 60_000,
  });

  const subscriptionQuery = useQuery({
    queryKey: ["vendor", "subscription", "status"],
    queryFn: fetchSubscriptionStatus,
    enabled: hasToken && onboardingQuery.isSuccess,
    staleTime: 60_000,
  });

  const subscription =
    subscriptionQuery.data?.subscription ?? onboardingQuery.data?.subscription ?? null;
  const isPremiumActive = subscription?.is_premium_active === true;
  const canPayPremium = subscription?.can_pay_premium === true;
  const requiresPayment = subscription?.requires_payment === true;
  const hasBusiness = onboardingQuery.data?.has_business === true;
  const photoLimit = subscription?.photo_limit ?? (isPremiumActive ? 20 : 5);
  const isVerified = subscription?.is_verified === true;
  const canBoost = subscription?.can_boost === true;
  const analyticsLocked = subscription?.analytics_locked ?? !isPremiumActive;

  const goToPremiumPayment = useCallback(() => {
    if (!hasToken) {
      navigate("/login", { state: { from: VENDOR_PREMIUM_PAYMENT_PATH } });
      return;
    }

    if (!hasBusiness) {
      localStorage.setItem("vendorPlan", "premium");
      void fetchVendorOnboardingStatus().then((status) => {
        navigate(onboardingRedirectPath(status));
      });
      return;
    }

    navigate(VENDOR_PREMIUM_PAYMENT_PATH);
  }, [hasBusiness, hasToken, navigate]);

  const goToBoost = useCallback(() => {
    navigate("/vendor/boost");
  }, [navigate]);

  const isLoading = hasToken && !subscription && onboardingQuery.isPending;

  return {
    subscription,
    isPremiumActive,
    canPayPremium,
    requiresPayment,
    hasBusiness,
    hasToken,
    isLoading,
    goToPremiumPayment,
    goToBoost,
    showPremiumUpgradeCta: !isPremiumActive && (canPayPremium || requiresPayment || !hasToken),
    photoLimit,
    isVerified,
    canBoost,
    analyticsLocked,
  };
}
