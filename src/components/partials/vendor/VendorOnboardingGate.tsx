import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { getAccessToken } from '@/auth/token';
import {
  fetchVendorOnboardingStatus,
  onboardingRedirectPath,
} from '@/features/subscription/vendorOnboardingApi';

type Props = {
  children: ReactNode;
  /** Only for vendors without a business_info row. */
  onboardingOnly?: boolean;
  /** Plan form / API-backed steps need login; choose-your-plan can be public. */
  requireAuth?: boolean;
};

export function VendorOnboardingGate({
  children,
  onboardingOnly = false,
  requireAuth = false,
}: Props) {
  const location = useLocation();
  const hasToken = Boolean(getAccessToken());

  const { data, isLoading, isError, isFetched } = useQuery({
    queryKey: ['vendor', 'onboarding', 'status'],
    queryFn: fetchVendorOnboardingStatus,
    enabled: onboardingOnly && hasToken,
    retry: 1,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  if (!onboardingOnly) {
    return <>{children}</>;
  }

  if (requireAuth && !hasToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!hasToken) {
    return <>{children}</>;
  }

  if (isError) {
    return <>{children}</>;
  }

  if (isLoading || !isFetched) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-brand-red" aria-label="Loading" />
      </div>
    );
  }

  if (data?.has_business === true) {
    return <Navigate to={onboardingRedirectPath(data)} replace />;
  }

  return <>{children}</>;
}
