import PaystackPop from '@paystack/inline-js';

import { isValidPaystackPublicKey, resolvePaystackPublicKey } from '@/features/payments/paymentConfigApi';

type PaystackPopWithResume = PaystackPop & {
  resumeTransaction: (
    accessCode: string,
    callbacks: {
      onSuccess?: (response: { reference?: string }) => void;
      onError?: (error: { message?: string }) => void;
      onCancel?: () => void;
    },
  ) => unknown;
};

export type OpenPaystackCheckoutOptions = {
  email: string;
  amountNgn: number;
  currency?: string;
  reference: string;
  accessCode?: string | null;
  /**
   * Vendor checkouts initialize on the server. Reusing `newTransaction` with that
   * same reference causes Paystack "Duplicate Transaction Reference".
   */
  requireAccessCode?: boolean;
  customerName?: string;
  customerPhone?: string;
  onSuccess: (reference: string) => void | Promise<void>;
  onClose?: () => void;
  onError?: (message: string) => void;
};

export async function openPaystackCheckout(options: OpenPaystackCheckoutOptions): Promise<void> {
  const accessCode = options.accessCode?.trim() ?? '';
  const amountKobo = Math.round(options.amountNgn * 100);

  if (amountKobo <= 0) {
    options.onError?.('Nothing left to pay for this checkout.');
    return;
  }

  const paystack = new PaystackPop() as PaystackPopWithResume;
  const callbacks = {
    onSuccess: (response: { reference?: string }) => {
      const reference = String(response?.reference ?? options.reference).trim();
      void Promise.resolve(options.onSuccess(reference));
    },
    onError: (error: { message?: string }) => {
      options.onError?.(error?.message?.trim() || 'Paystack could not start checkout.');
    },
    onCancel: () => {
      options.onClose?.();
    },
  };

  if (accessCode) {
    paystack.resumeTransaction(accessCode, callbacks);
    return;
  }

  if (options.requireAccessCode) {
    options.onError?.(
      'Paystack checkout expired. Close this window and tap Pay again for a fresh payment session.',
    );
    return;
  }

  const paystackKey = await resolvePaystackPublicKey();
  if (!isValidPaystackPublicKey(paystackKey)) {
    options.onError?.('Paystack is not configured correctly. Contact support.');
    return;
  }

  paystack.newTransaction({
    key: paystackKey,
    email: options.email,
    amount: amountKobo,
    currency: options.currency ?? 'NGN',
    reference: options.reference,
    metadata: {
      custom_fields: [
        { display_name: 'Customer name', variable_name: 'customer_name', value: options.customerName ?? 'Gidira Customer' },
        { display_name: 'Phone', variable_name: 'phone', value: options.customerPhone ?? '08000000000' },
      ],
    },
    ...callbacks,
  });
}
