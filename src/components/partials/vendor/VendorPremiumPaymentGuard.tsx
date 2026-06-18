import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { fetchSubscriptionStatus } from "@/features/subscription/vendorSubscriptionApi";
import {
  buildVendorPremiumInfoPath,
  isVendorPremiumPreviewPath,
  VENDOR_PREMIUM_INFO_PATH,
  VENDOR_PREMIUM_PAYMENT_PATH,
  VENDOR_PREMIUM_PREVIEW_PATHS,
} from "@/hooks/useVendorSubscriptionAccess";

const ALLOWED_PATHS = [
  VENDOR_PREMIUM_INFO_PATH,
  VENDOR_PREMIUM_PAYMENT_PATH,
  "/vendor/subscription/pay",
  "/vendor/settings",
  ...VENDOR_PREMIUM_PREVIEW_PATHS,
];

export function VendorPremiumPaymentGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const { data, isLoading } = useQuery({
    queryKey: ["vendor", "subscription", "status"],
    queryFn: () => fetchSubscriptionStatus(),
    retry: 1,
  });

  const requiresPayment = data?.subscription?.requires_payment === true;
  const isAllowedPath =
    ALLOWED_PATHS.some((path) => location.pathname.startsWith(path)) ||
    isVendorPremiumPreviewPath(location.pathname);

  useEffect(() => {
    if (isLoading || !requiresPayment || isAllowedPath) {
      return;
    }

    navigate(buildVendorPremiumInfoPath(), { replace: true });
  }, [isAllowedPath, isLoading, navigate, requiresPayment]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Loading account status…
      </div>
    );
  }

  if (requiresPayment && !isAllowedPath) {
    return null;
  }

  return <>{children}</>;
}
