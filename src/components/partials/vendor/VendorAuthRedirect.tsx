import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { getAccessToken } from '@/auth/token';
import {
  defaultOnboardingStatus,
  fetchVendorOnboardingStatus,
  onboardingRedirectPath,
} from '@/features/subscription/vendorOnboardingApi';

/**
 * Sends authenticated vendors to the correct onboarding step (plan / payment / dashboard).
 * Used by GuestGate so login does not flash the vendor dashboard shell first.
 */
export function VendorAuthRedirect() {
  const hasToken = Boolean(getAccessToken());

  const { data, isPending, isError } = useQuery({
    queryKey: ['vendor', 'onboarding', 'status'],
    queryFn: fetchVendorOnboardingStatus,
    enabled: hasToken,
    retry: 1,
    staleTime: 60_000,
  });

  if (!hasToken) {
    return <Navigate to="/login/email?role=vendor" replace />;
  }

  if (!data && isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-brand-red" aria-label="Loading vendor account" />
      </div>
    );
  }

  const status = isError || !data ? defaultOnboardingStatus() : data;

  return <Navigate to={onboardingRedirectPath(status)} replace />;
}
