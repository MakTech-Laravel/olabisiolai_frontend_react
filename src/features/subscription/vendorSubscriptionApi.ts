import { request } from '@/api/request';

export type PaymentGateway = 'flutterwave' | 'paystack';

export type SubscriptionPackage = {
  id: string;
  title: string;
  amount: number;
  description: string;
  perks: string[];
};

export type SubscriptionPayment = {
  id: number;
  purpose: string;
  purpose_label?: string;
  package_id: string;
  amount: number;
  currency: string;
  tx_ref: string;
  gateway?: PaymentGateway | null;
  status: 'pending' | 'completed' | 'failed';
  is_consumed: boolean;
  paid_at: string | null;
};

export type SubscriptionCheckoutInit = {
  payment: SubscriptionPayment;
  payments: {
    subscription: SubscriptionPayment;
    boost: SubscriptionPayment | null;
  };
  total_amount: number;
  currency: string;
};

export type VendorSubscriptionState = {
  plan: 'free' | 'premium';
  plan_label: string;
  status: 'active' | 'pending_payment' | 'expired';
  status_label: string;
  expires_at: string | null;
  expires_at_iso: string | null;
  is_expired: boolean;
  days_remaining: number;
  requires_payment: boolean;
  can_pay_premium: boolean;
  is_premium_active: boolean;
  can_access_features: boolean;
  photo_limit?: number;
  free_photo_limit?: number;
  premium_photo_limit?: number;
  is_verified?: boolean;
  can_boost?: boolean;
  analytics_locked?: boolean;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export async function fetchSubscriptionPackages(): Promise<{
  currency: string;
  packages: SubscriptionPackage[];
}> {
  const res = await request.get<ApiEnvelope<{ currency: string; packages: SubscriptionPackage[] }>>(
    '/vendor/subscription/packages',
  );
  return res.data.data;
}

export async function fetchSubscriptionStatus(options?: {
  businessId?: number;
}): Promise<{
  subscription: VendorSubscriptionState;
}> {
  const businessId = options?.businessId;
  const res = await request.get<ApiEnvelope<{ subscription: VendorSubscriptionState }>>(
    '/vendor/subscription/status',
    {
      params: businessId ? { business_id: businessId } : undefined,
    },
  );
  return res.data.data;
}

export async function initSubscriptionPayment(
  args?: {
    gateway?: PaymentGateway;
    businessId?: number;
    boost?: { tierKey: string; durationDays: number; budgetAmount?: number };
  },
): Promise<SubscriptionCheckoutInit> {
  const boost = args?.boost;
  const gateway = args?.gateway;
  const res = await request.post<ApiEnvelope<SubscriptionCheckoutInit>>('/vendor/subscription/payment/init', {
    gateway,
    ...(args?.businessId ? { business_id: args.businessId } : null),
    ...(boost
      ? {
        boost_tier_key: boost.tierKey,
        boost_duration_days: boost.durationDays,
        ...(boost.budgetAmount != null
          ? { boost_budget_amount: boost.budgetAmount }
          : null),
      }
      : null),
  });
  if (res.data?.success !== true || !res.data.data) {
    throw new Error(res.data?.message ?? 'Unable to start premium payment.');
  }
  return res.data.data;
}

export async function resumeSubscriptionPayment(): Promise<SubscriptionCheckoutInit> {
  const res = await request.post<ApiEnvelope<SubscriptionCheckoutInit>>(
    '/vendor/subscription/payment/resume',
  );
  if (res.data?.success !== true || !res.data.data) {
    throw new Error(res.data?.message ?? 'No pending premium payment found.');
  }
  return res.data.data;
}

export async function confirmSubscriptionPayment(
  paymentId: number,
  gatewayTransactionId: string,
  gateway: PaymentGateway,
): Promise<{
  subscription: VendorSubscriptionState;
  message: string;
}> {
  const res = await request.post<
    ApiEnvelope<{ subscription: VendorSubscriptionState; payment: SubscriptionPayment }>
  >('/vendor/subscription/payment/confirm', {
    payment_id: paymentId,
    gateway_transaction_id: gatewayTransactionId,
    gateway,
  });
  if (res.data?.success !== true || !res.data.data?.subscription) {
    throw new Error(res.data?.message ?? 'Premium activation failed.');
  }
  return {
    subscription: res.data.data.subscription,
    message: res.data.message ?? 'Premium subscription activated.',
  };
}
