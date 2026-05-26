import { request } from "@/api/request";
import {
  appendBusinessHoursToFormData,
  serializeBusinessHoursForApi,
  type BusinessHourEntry,
} from "@/features/business/businessHours";
import {
  appendSocialAccountsToFormData,
  type SocialAccount,
} from "@/features/business/socialAccounts";

export type CreateVendorBusinessPayload = {
  subscription_plan?: "free" | "premium";
  category_id: string;
  subcategory?: string;
  /** Must match `locations.id` from form-options (required by API). */
  location_id: string;
  business_name: string;
  location: string;
  state: string;
  city: string;
  lga: string;
  full_address?: string;
  business_description: string;
  services: string[];
  phone: string;
  whatsapp?: string;
  website?: string;
  social_accounts?: SocialAccount[];
  logo?: File | null;
  cover_photos?: File[];
  business_hours?: BusinessHourEntry[];
};

function appendIfTruthy(formData: FormData, key: string, value: string | undefined) {
  if (typeof value === "string" && value.trim()) {
    formData.append(key, value.trim());
  }
}

export type CreateVendorBusinessResponse = {
  success: boolean;
  message: string;
  data: {
    requires_subscription_payment?: boolean;
    subscription?: { requires_payment?: boolean };
  };
};

export async function createVendorBusiness(
  payload: CreateVendorBusinessPayload,
): Promise<CreateVendorBusinessResponse> {
  const formData = new FormData();

  const plan =
    payload.subscription_plan ??
    (localStorage.getItem("vendorPlan") === "premium" ? "premium" : "free");
  formData.append("subscription_plan", plan);

  formData.append("category_id", payload.category_id);
  appendIfTruthy(formData, "subcategory", payload.subcategory);
  formData.append("location_id", payload.location_id.trim());
  formData.append("business_name", payload.business_name.trim());
  formData.append("location", payload.location.trim());
  formData.append("state", payload.state.trim());
  formData.append("city", payload.city.trim());
  formData.append("lga", payload.lga.trim());
  formData.append("business_description", payload.business_description.trim());
  formData.append("phone", payload.phone.trim());

  appendIfTruthy(formData, "whatsapp", payload.whatsapp);
  appendIfTruthy(formData, "website", payload.website);
  if (payload.social_accounts?.length) {
    appendSocialAccountsToFormData(formData, payload.social_accounts);
  }
  appendIfTruthy(formData, "full_address", payload.full_address);

  payload.services
    .map((service) => service.trim())
    .filter(Boolean)
    .forEach((service, index) => {
      formData.append(`services[${index}]`, service);
    });

  if (payload.logo) {
    formData.append("logo", payload.logo);
  }

  (payload.cover_photos ?? []).forEach((photo, index) => {
    formData.append(`cover_photos[${index}]`, photo);
  });

  if (payload.business_hours?.length) {
    appendBusinessHoursToFormData(formData, payload.business_hours);
  }

  const res = await request.post<CreateVendorBusinessResponse>("/vendor/business/create", formData);
  return res.data;
}

export function isPremiumPlanSelected(): boolean {
  return localStorage.getItem("vendorPlan") === "premium";
}

export function businessCreateRequiresPayment(response: CreateVendorBusinessResponse): boolean {
  if (isPremiumPlanSelected()) {
    return true;
  }

  return (
    response.data?.requires_subscription_payment === true ||
    response.data?.subscription?.requires_payment === true
  );
}

export type UpdateVendorBusinessPayload = {
  category_id: string;
  subcategory?: string;
  location_id: string;
  business_name: string;
  location: string;
  state: string;
  city: string;
  lga: string;
  business_description: string;
  services: string[];
  phone: string;
  whatsapp?: string;
  website?: string;
  social_accounts?: SocialAccount[];
  logo?: File | null;
  cover_photos?: File[];
  business_hours?: BusinessHourEntry[];
};

function buildUpdateVendorBusinessJsonBody(
  payload: UpdateVendorBusinessPayload,
): Record<string, unknown> {
  const services = payload.services.map((service) => service.trim()).filter(Boolean);

  const body: Record<string, unknown> = {
    category_id: Number(payload.category_id),
    location_id: Number(payload.location_id),
    business_name: payload.business_name.trim(),
    business_description: payload.business_description.trim(),
    services,
    phone: payload.phone.trim(),
  };

  if (payload.subcategory?.trim()) {
    body.subcategory = payload.subcategory.trim();
  }
  if (payload.whatsapp?.trim()) {
    body.whatsapp = payload.whatsapp.trim();
  }
  if (payload.website?.trim()) {
    body.website = payload.website.trim();
  }
  if (payload.social_accounts?.length) {
    body.social_accounts = payload.social_accounts;
  }
  if (payload.business_hours?.length) {
    body.business_hours = serializeBusinessHoursForApi(payload.business_hours);
  }

  return body;
}

function appendUpdateVendorBusinessFormData(
  formData: FormData,
  payload: UpdateVendorBusinessPayload,
): void {
  formData.append("category_id", payload.category_id);
  appendIfTruthy(formData, "subcategory", payload.subcategory);
  formData.append("location_id", payload.location_id.trim());
  formData.append("business_name", payload.business_name.trim());
  formData.append("location", payload.location.trim());
  formData.append("state", payload.state.trim());
  formData.append("city", payload.city.trim());
  formData.append("lga", payload.lga.trim());
  formData.append("business_description", payload.business_description.trim());
  formData.append("phone", payload.phone.trim());

  appendIfTruthy(formData, "whatsapp", payload.whatsapp);
  appendIfTruthy(formData, "website", payload.website);
  appendSocialAccountsToFormData(formData, payload.social_accounts ?? []);

  payload.services
    .map((service) => service.trim())
    .filter(Boolean)
    .forEach((service, index) => {
      formData.append(`services[${index}]`, service);
    });

  if (payload.logo) {
    formData.append("logo", payload.logo);
  }

  (payload.cover_photos ?? []).forEach((photo, index) => {
    formData.append(`cover_photos[${index}]`, photo);
  });

  if (payload.business_hours?.length) {
    appendBusinessHoursToFormData(formData, payload.business_hours);
  }
}

export async function updateVendorBusiness(payload: UpdateVendorBusinessPayload): Promise<unknown> {
  const hasFileUploads = Boolean(payload.logo) || (payload.cover_photos?.length ?? 0) > 0;

  // Production PHP/nginx often fail to parse multipart when method-spoofed to PUT.
  // JSON PUT works reliably for profile edits without new images.
  if (!hasFileUploads) {
    const res = await request.put("/vendor/business/update", buildUpdateVendorBusinessJsonBody(payload));
    return res.data;
  }

  const formData = new FormData();
  appendUpdateVendorBusinessFormData(formData, payload);
  // Use native POST route (no _method=PUT) so PHP parses multipart fields and files.
  const res = await request.post("/vendor/business/update", formData);
  return res.data;
}
