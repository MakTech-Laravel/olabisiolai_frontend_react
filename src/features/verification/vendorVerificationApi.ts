import { request } from '@/api/request';

export type PaymentGateway = 'flutterwave' | 'paystack';

export type VerificationPackage = {
  id: string;
  title: string;
  amount: number;
  description: string;
  perks: string[];
};

export type VerificationPayment = {
  id: number;
  purpose: string;
  package_id: string;
  amount: number;
  currency: string;
  tx_ref: string;
  gateway?: PaymentGateway | null;
  status: 'pending' | 'completed' | 'failed';
  is_consumed: boolean;
  paid_at: string | null;
};

export type PurchasedVerificationPackage = {
  id: string;
  title: string;
  amount: number;
  currency: string;
  description?: string | null;
  paid_at: string | null;
  is_consumed: boolean;
  usage_message: string;
};

export type VerificationStatusPayload = {
  verification_status: 'none' | 'pending' | 'approved';
  verification_status_label: string;
  is_flagged: boolean;
  is_approved: boolean;
  verified_at: string | null;
  awaiting_document_submission?: boolean;
  consumable_payment_id?: number | null;
  purchased_package?: PurchasedVerificationPackage | null;
  documents: Array<{
    id: number;
    parent_document_id?: number | null;
    document_type: string;
    title: string;
    description?: string | null;
    file_name: string;
    file_url?: string | null;
    status: "pending" | "approved" | "rejected";
    rejection_reason?: string | null;
    submitted_at: string;
  }>;
  notes: Array<{ id: number; note: string; created_at: string }>;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

function readScopedBusinessId(): number | undefined {
  if (typeof window === 'undefined') return undefined;
  const raw = new URLSearchParams(window.location.search).get('business_id');
  const id = raw ? Number(raw) : NaN;
  return Number.isFinite(id) && id > 0 ? id : undefined;
}

function scopedBusinessParams(): { business_id?: number } {
  const businessId = readScopedBusinessId();
  return businessId ? { business_id: businessId } : {};
}

export async function fetchVerificationPackages(): Promise<{
  currency: string;
  packages: VerificationPackage[];
}> {
  const res = await request.get<ApiEnvelope<{ currency: string; packages: VerificationPackage[] }>>(
    '/vendor/verification/packages',
  );
  return res.data.data;
}

function assertApiSuccess<T>(payload: ApiEnvelope<T>): T {
  if (!payload.success || payload.data === undefined || payload.data === null) {
    throw new Error(payload.message || 'Request failed.');
  }
  return payload.data;
}

export function clearVerificationPaymentSession(): void {
  sessionStorage.removeItem(PAYMENT_ID_KEY);
}

export type InitVerificationPaymentResult = {
  payment: VerificationPayment;
  paid_from_wallet: boolean;
  awaiting_document_submission: boolean;
  consumable_payment_id: number | null;
};

export async function initVerificationPayment(
  packageId: string,
  gateway?: PaymentGateway,
  useWallet?: boolean,
): Promise<InitVerificationPaymentResult> {
  const res = await request.post<
    ApiEnvelope<{
      payment: VerificationPayment;
      paid_from_wallet?: boolean;
      awaiting_document_submission?: boolean;
      consumable_payment_id?: number | null;
    }>
  >('/vendor/verification/payment/init', {
    package_id: packageId,
    gateway,
    use_wallet: useWallet,
    ...scopedBusinessParams(),
  });
  const data = assertApiSuccess(res.data);
  return {
    payment: data.payment,
    paid_from_wallet: Boolean(data.paid_from_wallet),
    awaiting_document_submission: Boolean(data.awaiting_document_submission),
    consumable_payment_id: data.consumable_payment_id ?? null,
  };
}

export type ConfirmVerificationPaymentResult = {
  payment: VerificationPayment;
  awaiting_document_submission: boolean;
  consumable_payment_id: number | null;
};

export async function confirmVerificationPayment(
  paymentId: number,
  gatewayTransactionId: string,
  gateway: PaymentGateway,
): Promise<ConfirmVerificationPaymentResult> {
  const res = await request.post<
    ApiEnvelope<{
      payment: VerificationPayment;
      awaiting_document_submission?: boolean;
      consumable_payment_id?: number | null;
    }>
  >('/vendor/verification/payment/confirm', {
    payment_id: paymentId,
    gateway_transaction_id: gatewayTransactionId,
    gateway,
    ...scopedBusinessParams(),
  });
  const data = assertApiSuccess(res.data);
  return {
    payment: data.payment,
    awaiting_document_submission: Boolean(data.awaiting_document_submission),
    consumable_payment_id: data.consumable_payment_id ?? null,
  };
}

export type ApplyDocumentInput = {
  document_type: string;
  title: string;
  description?: string;
  file: File;
};

export async function applyForVerification(
  paymentId: number,
  documents: ApplyDocumentInput[],
): Promise<{ verification_status: string }> {
  const formData = new FormData();
  formData.append('payment_id', String(paymentId));
  const businessId = readScopedBusinessId();
  if (businessId) {
    formData.append('business_id', String(businessId));
  }

  documents.forEach((doc, index) => {
    formData.append(`documents[${index}][document_type]`, doc.document_type);
    formData.append(`documents[${index}][title]`, doc.title);
    if (doc.description?.trim()) {
      formData.append(`documents[${index}][description]`, doc.description.trim());
    }
    formData.append(`documents[${index}][document]`, doc.file);
  });

  const res = await request.post<ApiEnvelope<{ verification_status: string }>>(
    '/vendor/verification/apply',
    formData,
  );
  const data = assertApiSuccess(res.data);
  return data;
}

export async function fetchVerificationStatus(): Promise<VerificationStatusPayload> {
  const res = await request.get<ApiEnvelope<VerificationStatusPayload>>('/vendor/verification/status', {
    params: scopedBusinessParams(),
  });
  return assertApiSuccess(res.data);
}

const PAYMENT_ID_KEY = 'verificationPaymentId';
const PLAN_STORAGE_KEY = 'verificationPlanId';

export function primeVerificationDocumentSession(status: VerificationStatusPayload): void {
  if (status.consumable_payment_id) {
    sessionStorage.setItem(PAYMENT_ID_KEY, String(status.consumable_payment_id));
  }
  if (status.purchased_package?.id) {
    sessionStorage.setItem(PLAN_STORAGE_KEY, status.purchased_package.id);
  }
  sessionStorage.setItem('paymentSource', 'verification');
}

export async function reuploadVerificationDocument(input: {
  document_type: string;
  title: string;
  description?: string;
  parent_document_id?: number;
  file: File;
}): Promise<void> {
  const formData = new FormData();
  formData.append('document_type', input.document_type);
  formData.append('title', input.title);
  if (input.description?.trim()) {
    formData.append('description', input.description.trim());
  }
  if (input.parent_document_id) {
    formData.append('parent_document_id', String(input.parent_document_id));
  }
  formData.append('document', input.file);

  await request.post('/vendor/verification/documents/upload', formData);
}
