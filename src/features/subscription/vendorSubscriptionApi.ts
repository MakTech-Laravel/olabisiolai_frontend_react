import { request } from '@/api/request';

export type PaymentGateway = 'flutterwave' | 'paystack';

export type BillingPeriod = 'monthly' | 'quarterly' | 'yearly' | 'lifetime';

export type SubscriptionPackage = {
  id: string;
  title: string;
  amount: number;
  description: string;
  perks: string[];
  original_price?: number | null;
  discount_label?: string | null;
  promotional_text?: string | null;
  billing_period?: BillingPeriod | null;
  is_recommended?: boolean;
  trial_eligible?: boolean;
  trial_duration_days?: number | null;
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
  gateway_amount?: number;
  wallet_applied?: number;
  wallet_balance?: number;
  currency: string;
  paidFromWallet?: boolean;
  subscription?: VendorSubscriptionState;
};

export type VendorSubscriptionState = {
  plan: 'free' | 'premium';
  plan_label: string;
  status: 'active' | 'pending_payment' | 'expired' | 'trialing' | 'cancelled';
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
  is_trial?: boolean;
  trial_ends_at?: string | null;
  trial_days_remaining?: number;
  trial_eligible?: boolean;
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

/**
 * `GET /subscription-packages` — unauthenticated, for the landing page and the
 * choose-your-plan screen before a vendor has signed up.
 */
export async function fetchPublicSubscriptionPackages(): Promise<{
  currency: string;
  packages: SubscriptionPackage[];
}> {
  try {
    const res = await request.get<ApiEnvelope<{ currency: string; packages: SubscriptionPackage[] }>>(
      '/subscription-packages',
      { skipAuthRedirect: true },
    );
    return res.data.data;
  } catch (error) {
    console.warn('[subscription] GET /subscription-packages failed', error);
    return { currency: 'NGN', packages: [] };
  }
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
    packageKey?: string;
    applyWallet?: boolean;
    boost?: { tierKey: string; durationDays: number; budgetAmount?: number };
  },
): Promise<SubscriptionCheckoutInit & { paidFromWallet?: boolean; subscription?: VendorSubscriptionState }> {
  const boost = args?.boost;
  const gateway = args?.gateway;
  const res = await request.post<
    ApiEnvelope<
      SubscriptionCheckoutInit & {
        paid_from_wallet?: boolean;
        subscription?: VendorSubscriptionState;
        wallet_balance?: number;
      }
    >
  >('/vendor/subscription/payment/init', {
    gateway,
    apply_wallet: args?.applyWallet,
    ...(args?.businessId ? { business_id: args.businessId } : null),
    ...(args?.packageKey ? { package_key: args.packageKey } : null),
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
  const data = res.data.data;
  if (data.paid_from_wallet && data.subscription) {
    return {
      ...data,
      paidFromWallet: true,
      subscription: data.subscription,
      payment: data.payment ?? data.payments?.subscription,
      payments: data.payments ?? {
        subscription: data.payment!,
        boost: null,
      },
      total_amount: 0,
      currency: 'NGN',
    };
  }
  return data;
}

export async function payPremiumFromWallet(args?: {
  businessId?: number;
  packageKey?: string;
  boost?: { tierKey: string; durationDays: number; budgetAmount?: number };
}): Promise<{
  subscription: VendorSubscriptionState;
  walletBalance: number;
  message: string;
}> {
  const boost = args?.boost;
  const res = await request.post<
    ApiEnvelope<{ subscription: VendorSubscriptionState; wallet_balance: number }>
  >('/vendor/subscription/payment/init', {
    use_wallet: true,
    ...(args?.businessId ? { business_id: args.businessId } : null),
    ...(args?.packageKey ? { package_key: args.packageKey } : null),
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
  if (res.data?.success !== true || !res.data.data?.subscription) {
    throw new Error(res.data?.message ?? 'Unable to pay premium from wallet.');
  }
  return {
    subscription: res.data.data.subscription,
    walletBalance: res.data.data.wallet_balance,
    message: res.data.message ?? 'Premium subscription activated.',
  };
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

export async function reconcileSubscriptionPayment(
  paystackReference: string,
  options?: { businessId?: number },
): Promise<{
  subscription: VendorSubscriptionState;
  message: string;
}> {
  const res = await request.post<
    ApiEnvelope<{ subscription: VendorSubscriptionState; payment: SubscriptionPayment }>
  >('/vendor/subscription/payment/reconcile', {
    paystack_reference: paystackReference,
    ...(options?.businessId ? { business_id: options.businessId } : {}),
  });
  if (res.data?.success !== true || !res.data.data?.subscription) {
    throw new Error(res.data?.message ?? 'Premium activation failed.');
  }
  return {
    subscription: res.data.data.subscription,
    message: res.data.message ?? 'Premium subscription activated.',
  };
}

export async function startSubscriptionTrial(args: {
  packageKey: string;
  businessId?: number;
}): Promise<{
  subscription: VendorSubscriptionState;
  message: string;
}> {
  const res = await request.post<ApiEnvelope<{ subscription: VendorSubscriptionState }>>(
    '/vendor/subscription/trial/start',
    {
      package_key: args.packageKey,
      ...(args.businessId ? { business_id: args.businessId } : null),
    },
  );
  if (res.data?.success !== true || !res.data.data?.subscription) {
    throw new Error(res.data?.message ?? 'Unable to start free trial.');
  }
  return {
    subscription: res.data.data.subscription,
    message: res.data.message ?? 'Free trial started successfully.',
  };
}

export async function cancelSubscription(options?: { businessId?: number }): Promise<{
  subscription: VendorSubscriptionState;
  message: string;
}> {
  const res = await request.post<ApiEnvelope<{ subscription: VendorSubscriptionState }>>(
    '/vendor/subscription/cancel',
    options?.businessId ? { business_id: options.businessId } : {},
  );
  if (res.data?.success !== true || !res.data.data?.subscription) {
    throw new Error(res.data?.message ?? 'Unable to cancel subscription.');
  }
  return {
    subscription: res.data.data.subscription,
    message: res.data.message ?? 'Premium subscription cancelled successfully.',
  };
}
