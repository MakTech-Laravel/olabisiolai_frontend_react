import { request } from "@/api/request";
import type { BoostCampaignRow } from "@/features/boost/boostCampaignTypes";
import { locationFromCatalogResponse } from "@/features/boost/locationBoostPlans";
import type { ParsedLocationOption } from "@/features/locations/vendorLocationOptions";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type PaymentGateway = "flutterwave" | "paystack";

export type VendorBoostPendingRequest = {
  id: number;
  tier_key: string;
  tier_label: string;
  duration_days: number;
  amount: number;
  status: string;
  status_label: string;
  payment_id?: number | null;
  can_continue_payment?: boolean;
  renew_type?: BoostRenewType | null;
};

export type VendorBoostCatalog = {
  location: ParsedLocationOption | null;
  pendingRequest: VendorBoostPendingRequest | null;
  isPremiumActive: boolean;
  campaigns: BoostCampaignRow[];
};

export async function fetchVendorBoostCatalog(): Promise<VendorBoostCatalog> {
  const res = await request.get<
    ApiEnvelope<{
      location: unknown;
      pending_request: VendorBoostPendingRequest | null;
      is_premium_active: boolean;
      campaigns: BoostCampaignRow[];
    }>
  >("/vendor/boost/catalog");

  const data = res.data.data;

  return {
    location: locationFromCatalogResponse(data.location),
    pendingRequest: data.pending_request,
    isPremiumActive: Boolean(data.is_premium_active),
    campaigns: data.campaigns ?? [],
  };
}

export type BoostRenewType = "extend" | "boost_again";

export type BoostPaymentSession = {
  id: number;
  /** Always `boosting` for boost checkout payments. */
  purpose: 'boosting' | string;
  reference_type?: string;
  package_id: string;
  amount: number;
  currency: string;
  tx_ref: string;
  gateway?: PaymentGateway | null;
  status: "pending" | "completed" | "failed";
  is_consumed: boolean;
  paid_at: string | null;
};

export async function resumeVendorBoostPayment(requestId: number): Promise<{
  payment: BoostPaymentSession;
  message: string;
}> {
  const res = await request.post<
    ApiEnvelope<{ payment: BoostPaymentSession; request: unknown }>
  >("/vendor/boost/payment/resume", {
    request_id: requestId,
  });

  return {
    payment: res.data.data.payment,
    message: res.data.message,
  };
}

export async function initVendorBoostPayment(params: {
  tierKey: string;
  durationDays: number;
  locationId?: string | number;
  renewType?: BoostRenewType;
  sourceCampaignId?: number;
  gateway?: PaymentGateway;
}): Promise<{ payment: BoostPaymentSession; message: string }> {
  const locationId =
    params.locationId !== undefined && params.locationId !== ""
      ? Number(params.locationId)
      : undefined;

  const res = await request.post<
    ApiEnvelope<{ payment: BoostPaymentSession; request: unknown }>
  >("/vendor/boost/payment/init", {
    tier_key: params.tierKey,
    duration_days: params.durationDays,
    location_id: locationId && Number.isFinite(locationId) ? locationId : undefined,
    renew_type: params.renewType,
    source_campaign_id: params.sourceCampaignId,
    gateway: params.gateway,
  });

  return {
    payment: res.data.data.payment,
    message: res.data.message,
  };
}

export async function confirmVendorBoostPayment(
  paymentId: number,
  gatewayTransactionId: string,
  gateway: PaymentGateway,
): Promise<{ message: string; campaigns: BoostCampaignRow[] }> {
  const res = await request.post<
    ApiEnvelope<{ payment: BoostPaymentSession; campaigns: BoostCampaignRow[] }>
  >("/vendor/boost/payment/confirm", {
    payment_id: paymentId,
    gateway_transaction_id: gatewayTransactionId,
    gateway,
  });

  return {
    message: res.data.message,
    campaigns: res.data.data.campaigns ?? [],
  };
}

export async function submitVendorBoostRequest(params: {
  tierKey: string;
  durationDays: number;
  locationId?: string | number;
  renewType?: BoostRenewType;
  sourceCampaignId?: number;
}): Promise<{ message: string; campaigns: BoostCampaignRow[] }> {
  const locationId =
    params.locationId !== undefined && params.locationId !== ""
      ? Number(params.locationId)
      : undefined;

  const res = await request.post<
    ApiEnvelope<{ request: unknown; campaigns: BoostCampaignRow[] }>
  >("/vendor/boost/request", {
    tier_key: params.tierKey,
    duration_days: params.durationDays,
    location_id: locationId && Number.isFinite(locationId) ? locationId : undefined,
    renew_type: params.renewType,
    source_campaign_id: params.sourceCampaignId,
  });

  return {
    message: res.data.message,
    campaigns: res.data.data.campaigns ?? [],
  };
}
