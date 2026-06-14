import { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { getAccessToken } from '@/auth/token';
import {
  fetchVendorOnboardingStatus,
  onboardingRedirectPath,
} from '@/features/subscription/vendorOnboardingApi';
import { isVendorPremiumPreviewPath } from '@/hooks/useVendorSubscriptionAccess';

/**
 * Guards vendor shell routes: no business → onboarding; unpaid premium → checkout.
 */
export function VendorAccessGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const hasToken = Boolean(getAccessToken());

  const { data, isPending, isError } = useQuery({
    queryKey: ['vendor', 'onboarding', 'status'],
    queryFn: fetchVendorOnboardingStatus,
    enabled: hasToken,
    retry: 1,
    staleTime: 60_000,
    refetchOnMount: false,
  });

  const subscriptionReady =
    data?.subscription?.is_premium_active === true || data?.subscription?.requires_payment === false;

  useEffect(() => {
    if (!hasToken || isPending || isError || !data) {
      return;
    }

    if (data.subscription?.requires_payment && !subscriptionReady) {
      if (isVendorPremiumPreviewPath(pathname)) {
        return;
      }
      navigate('/vendor/premium-payment', { replace: true });
    }
  }, [data, hasToken, isError, isPending, navigate, pathname, subscriptionReady]);

  if (!hasToken) {
    return <>{children}</>;
  }

  if (!data && isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-brand-red" aria-label="Loading vendor account" />
      </div>
    );
  }

  if (isError) {
    return <>{children}</>;
  }

  if (data && !data.has_business) {
    return <Navigate to={onboardingRedirectPath(data)} replace />;
  }

  return <>{children}</>;
}
