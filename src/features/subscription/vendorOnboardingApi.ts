import { isAxiosError } from 'axios';

import { request } from '@/api/request';
import type { VendorSubscriptionState } from '@/features/subscription/vendorSubscriptionApi';

export type VendorOnboardingStatus = {
  has_business: boolean;
  can_access_onboarding: boolean;
  redirect_to: string;
  subscription: VendorSubscriptionState | null;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const defaultOnboardingStatus = (): VendorOnboardingStatus => ({
  has_business: false,
  can_access_onboarding: true,
  redirect_to: '/vendor/choose-your-plan',
  subscription: null,
});

export async function fetchVendorOnboardingStatus(): Promise<VendorOnboardingStatus> {
  try {
    const res = await request.get<ApiEnvelope<VendorOnboardingStatus>>('/vendor/onboarding/status');

    if (res.data?.success !== true || !res.data.data) {
      return defaultOnboardingStatus();
    }

    return res.data.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      throw error;
    }

    return defaultOnboardingStatus();
  }
}

export function onboardingRedirectPath(status: VendorOnboardingStatus): string {
  if (status.redirect_to) {
    return status.redirect_to;
  }

  if (!status.has_business) {
    return '/vendor/choose-your-plan';
  }

  if (status.subscription?.requires_payment) {
    return '/vendor/premium-payment';
  }

  return '/vendor/dashboard';
}

/** After vendor login — skip `/vendor` shell; go straight to plan, payment, or dashboard. */
export async function resolveVendorPostLoginPath(): Promise<string> {
  const status = await fetchVendorOnboardingStatus();

  return onboardingRedirectPath(status);
}
