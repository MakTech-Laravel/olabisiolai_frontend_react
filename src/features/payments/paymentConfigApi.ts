import { request } from '@/api/request';
import { env } from '@/config/env';

type PaymentConfigResponse = {
  paystack_public_key: string;
  flutterwave_public_key: string;
};

let cachedConfig: PaymentConfigResponse | null = null;
let configPromise: Promise<PaymentConfigResponse> | null = null;

export async function fetchPaymentConfig(): Promise<PaymentConfigResponse> {
  if (cachedConfig) {
    return cachedConfig;
  }

  if (!configPromise) {
    configPromise = request
      .get<{ success: boolean; data: PaymentConfigResponse }>('/payments/config', {
        skipAuthRedirect: true,
      })
      .then((res) => {
        cachedConfig = res.data.data ?? { paystack_public_key: '', flutterwave_public_key: '' };
        return cachedConfig;
      })
      .finally(() => {
        configPromise = null;
      });
  }

  return configPromise;
}

export async function resolvePaystackPublicKey(): Promise<string> {
  const fromEnv = env.paystackPublicKey?.trim() ?? '';
  if (fromEnv.startsWith('pk_test_') || fromEnv.startsWith('pk_live_')) {
    return fromEnv;
  }

  try {
    const config = await fetchPaymentConfig();
    const fromApi = config.paystack_public_key?.trim() ?? '';
    if (fromApi.startsWith('pk_test_') || fromApi.startsWith('pk_live_')) {
      return fromApi;
    }
  } catch {
    // fall through to env value
  }

  return fromEnv;
}

export function isValidPaystackPublicKey(key: string | null | undefined): boolean {
  const trimmed = key?.trim() ?? '';
  return trimmed.startsWith('pk_test_') || trimmed.startsWith('pk_live_');
}
