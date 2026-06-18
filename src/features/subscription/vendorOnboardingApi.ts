import { isAxiosError } from 'axios';

import { request } from '@/api/request';
import { businessProfilePath } from '@/lib/businessProfile';
import { buildVendorPremiumInfoPath } from '@/hooks/useVendorSubscriptionAccess';
import type { VendorSubscriptionState } from '@/features/subscription/vendorSubscriptionApi';
export type VendorOnboardingStatus = {
  has_business: boolean;
  can_access_onboarding: boolean;
  redirect_to: string | null;
  business_id: number | null;
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
  redirect_to: '/user/profile',
  business_id: null,
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
  if (status.subscription?.requires_payment) {
    return buildVendorPremiumInfoPath(status.business_id);
  }

  if (status.business_id) {
    return businessProfilePath(status.business_id);
  }

  if (status.redirect_to) {
    return status.redirect_to;
  }

  if (!status.has_business) {
    return '/user/profile';
  }

  return '/user/profile';
}

/** After vendor login — personal profile hub (all businesses), not the business edit page. */
export async function resolveVendorPostLoginPath(): Promise<string> {
  const status = await fetchVendorOnboardingStatus();

  if (status.subscription?.requires_payment) {
    return buildVendorPremiumInfoPath(status.business_id);
  }

  return '/user/profile';
}
