import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { fetchVendorOnboardingStatus } from '@/features/subscription/vendorOnboardingApi';

type Props = {
  children: React.ReactNode;
};

/** Premium checkout — only when business exists and premium payment is still due. */
export function VendorPremiumPaymentGate({ children }: Props) {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['vendor', 'onboarding', 'status'],
    queryFn: fetchVendorOnboardingStatus,
    retry: 1,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (isLoading || !data) {
      return;
    }

    if (!data.has_business) {
      navigate('/vendor/plan-form', { replace: true });
      return;
    }

    if (data.subscription?.is_premium_active) {
      navigate('/vendor/dashboard', { replace: true });
      return;
    }

    if (!data.subscription?.can_pay_premium && !data.subscription?.requires_payment) {
      navigate('/vendor/dashboard', { replace: true });
    }
  }, [data, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-brand-red" aria-label="Loading checkout" />
      </div>
    );
  }

  if (isError) {
    return <>{children}</>;
  }

  if (!data?.has_business) {
    return null;
  }

  if (data.subscription?.is_premium_active) {
    return null;
  }

  if (!data.subscription?.can_pay_premium && !data.subscription?.requires_payment) {
    return null;
  }

  return <>{children}</>;
}
