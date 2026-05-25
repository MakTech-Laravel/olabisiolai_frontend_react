import { request } from '@/api/request';

export type VendorPaymentListItem = {
  id: number;
  purpose: string;
  /** Payment reference type (same as purpose; e.g. boosting, subscription, verification). */
  reference_type?: string;
  purpose_label: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  tx_ref: string;
  paid_at: string | null;
  paid_at_iso: string | null;
  created_at: string | null;
};

export type VendorPaymentDetail = VendorPaymentListItem & {
  gateway_transaction_id: string | null;
  is_consumed: boolean;
  package_id: string | null;
  metadata: Record<string, unknown> | null;
};

export type VendorPaymentMethod = {
  id: number;
  label: string | null;
  cardholder_name: string;
  email: string;
  phone: string;
  last_four: string | null;
  card_brand: string | null;
  exp_month: string | null;
  exp_year: string | null;
  billing_line1: string | null;
  billing_city: string | null;
  billing_state: string | null;
  billing_country: string | null;
  is_default: boolean;
  created_at: string | null;
};

export type BillingProfilePayload = {
  label?: string | null;
  cardholder_name: string;
  email: string;
  phone: string;
  last_four?: string | null;
  card_brand?: string | null;
  exp_month?: string | null;
  exp_year?: string | null;
  billing_line1?: string | null;
  billing_city?: string | null;
  billing_state?: string | null;
  billing_country?: string | null;
  is_default?: boolean;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type SubscriptionMonthRange = {
  /** First calendar month containing a completed subscription `paid_at` */
  start_month: string;
  /** Current calendar month */
  end_month: string;
  has_subscription_history: boolean;
};

type VendorPaymentsListData = {
  items: VendorPaymentListItem[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  subscription_month_range: SubscriptionMonthRange;
};

export async function fetchVendorPayments(params?: {
  page?: number;
  per_page?: number;
  purpose?: string;
  /** `YYYY-MM` — filter by paid month, or created month if not paid yet */
  month?: string;
}): Promise<VendorPaymentsListData> {
  const res = await request.get<ApiEnvelope<VendorPaymentsListData>>('/vendor/payments', { params });
  return res.data.data;
}

export async function fetchVendorPaymentDetail(paymentId: number): Promise<{ payment: VendorPaymentDetail }> {
  const res = await request.get<ApiEnvelope<{ payment: VendorPaymentDetail }>>(`/vendor/payments/${paymentId}`);
  return res.data.data;
}

export async function fetchVendorPaymentMethods(): Promise<{ items: VendorPaymentMethod[] }> {
  const res = await request.get<ApiEnvelope<{ items: VendorPaymentMethod[] }>>('/vendor/payment-methods');
  return res.data.data;
}

export async function createVendorPaymentMethod(
  payload: BillingProfilePayload,
): Promise<{ payment_method: VendorPaymentMethod }> {
  const res = await request.post<ApiEnvelope<{ payment_method: VendorPaymentMethod }>>('/vendor/payment-methods', payload);
  return res.data.data;
}

export async function setDefaultVendorPaymentMethod(id: number): Promise<{ payment_method: VendorPaymentMethod }> {
  const res = await request.patch<ApiEnvelope<{ payment_method: VendorPaymentMethod }>>(
    `/vendor/payment-methods/${id}/default`,
  );
  return res.data.data;
}

export async function deleteVendorPaymentMethod(id: number): Promise<void> {
  await request.delete(`/vendor/payment-methods/${id}`);
}

/** CSV export; uses same `purpose` / `month` filters as the list. */
export async function downloadVendorPaymentsCsv(params: { purpose?: string; month?: string }): Promise<void> {
  const { api } = await import('@/api/client');
  const res = await api.get<Blob>('/vendor/payments/export', {
    params,
    responseType: 'blob',
    validateStatus: (status) => status === 200 || status === 422,
  });

  if (res.status !== 200) {
    let message = 'Download failed.';
    try {
      const text = await (res.data as Blob).text();
      const json = JSON.parse(text) as { message?: string };
      if (json.message) message = json.message;
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  const blob = res.data;
  const cd = (res.headers['content-disposition'] ?? '').toString();
  let filename = 'payment-history.csv';
  const match = /filename\*=UTF-8''([^;]+)|filename="([^"]+)"|filename=([^;]+)/i.exec(cd);
  if (match) {
    filename = decodeURIComponent((match[1] ?? match[2] ?? match[3] ?? filename).trim().replace(/"/g, ''));
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
