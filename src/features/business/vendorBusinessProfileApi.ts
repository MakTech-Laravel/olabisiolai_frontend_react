import { isAxiosError } from "axios";

import { request } from "@/api/request";
import {
  parseBusinessHours,
  parseBusinessHoursDisplay,
  type BusinessHourEntry,
  type BusinessHoursDisplayRow,
} from "@/features/business/businessHours";
import { parseSocialAccounts, type SocialAccount } from "@/features/business/socialAccounts";
import { normalizeSubcategories } from "@/features/categories/categoryParsers";
import { formatBusinessLocationFromParts } from "@/features/maps/formatBusinessLocation";
import { resolveMediaUrl, resolveMediaUrls } from "@/lib/mediaUrl";

type RawRecord = Record<string, unknown>;

export type VendorBusinessProfile = {
  id: number;
  businessName: string;
  categoryId: number;
  categoryName: string;
  categorySubcategories: string[];
  subcategory: string;
  locationId: number;
  state: string;
  city: string;
  lga: string;
  locationLabel: string;
  locationFullName: string;
  streetAddress: string;
  locationNarrative: string;
  locationDisplay: string;
  latitude: number | null;
  longitude: number | null;
  googlePlaceId: string | null;
  description: string;
  services: string[];
  phone: string;
  whatsapp: string;
  website: string;
  socialAccounts: SocialAccount[];
  logoUrl: string;
  coverPhotoUrls: string[];
  coverPhotoPaths: string[];
  verificationStatus: string;
  isFlagged: boolean;
  businessStatus: string;
  boostStatus: "active" | "none";
  isPremiumActive: boolean;
  businessHours: BusinessHourEntry[];
  businessHoursDisplay: BusinessHoursDisplayRow[];
};

function asRecord(value: unknown): RawRecord | null {
  if (!value || typeof value !== "object") return null;
  return value as RawRecord;
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function pickString(source: RawRecord, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const text = asString(source[key]).trim();
    if (text) return text;
  }
  return fallback;
}

function pickRecord(source: RawRecord, keys: string[]): RawRecord | null {
  for (const key of keys) {
    const value = asRecord(source[key]);
    if (value) return value;
  }
  return null;
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => asString(entry).trim()).filter(Boolean);
}

export function parseVendorBusinessProfile(raw: unknown): VendorBusinessProfile | null {
  const item = asRecord(raw);
  if (!item) return null;

  const categoryObj = pickRecord(item, ["category"]);
  const locationObj = pickRecord(item, ["location"]);

  const id = asNumber(item.id) ?? 0;
  if (id <= 0) return null;

  const categoryId = asNumber(categoryObj?.id ?? item.category_id) ?? 0;
  const categoryName = pickString(categoryObj ?? {}, ["name"], "Uncategorized");

  const locationId = asNumber(locationObj?.id ?? item.location_id) ?? 0;
  const state = pickString(locationObj ?? {}, ["state"], "");
  const city = pickString(locationObj ?? {}, ["city"], "");
  const lga = pickString(locationObj ?? {}, ["name", "lga"], "");
  const locationLabel = [city, state].filter(Boolean).join(", ");
  const locationFullName =
    pickString(locationObj ?? {}, ["full_name"], "") ||
    [lga, city, state].filter(Boolean).join(", ") ||
    locationLabel ||
    "N/A";

  const boostRaw = pickString(item, ["boost_status"], "none").toLowerCase();

  return {
    id,
    businessName: pickString(item, ["business_name", "name"], ""),
    categoryId,
    categoryName,
    categorySubcategories: normalizeSubcategories(categoryObj?.subcategories ?? item.category_subcategories),
    subcategory: pickString(item, ["subcategory"], ""),
    locationId,
    state,
    city,
    lga,
    locationLabel: locationLabel || locationFullName,
    locationFullName,
    streetAddress: pickString(item, ["street_address", "full_address"], ""),
    locationNarrative: pickString(item, ["location_narrative", "locationNarrative"], ""),
    locationDisplay:
      pickString(item, ["location_display", "locationDisplay"], "") ||
      formatBusinessLocationFromParts({ city, state, lga, fullName: locationFullName }, pickString(item, ["location_narrative", "locationNarrative"], "")),
    latitude: asNumber(item.latitude ?? item.lat),
    longitude: asNumber(item.longitude ?? item.lng),
    googlePlaceId: pickString(item, ["google_place_id", "googlePlaceId"], "") || null,
    description: pickString(item, ["business_description", "description"], ""),
    services: parseStringArray(item.services_offered),
    phone: pickString(item, ["phone"], ""),
    whatsapp: pickString(item, ["whatsapp"], ""),
    website: pickString(item, ["website"], ""),
    socialAccounts: parseSocialAccounts(item.social_accounts ?? item.socialAccounts),
    logoUrl: resolveMediaUrl(pickString(item, ["logo_url", "logo"], "")),
    coverPhotoUrls: resolveMediaUrls(parseStringArray(item.cover_photo_urls)),
    coverPhotoPaths: parseStringArray(item.cover_photo_paths),
    verificationStatus: pickString(item, ["verification_status"], "none").toLowerCase(),
    isFlagged: item.is_flagged === true || item.is_flagged === 1 || item.is_flagged === "1",
    businessStatus: pickString(item, ["business_status"], "active").toLowerCase(),
    boostStatus: boostRaw === "active" ? "active" : "none",
    isPremiumActive:
      item.is_premium_active === true ||
      item.is_premium_active === 1 ||
      item.is_premium_active === "1" ||
      item.is_premium === true ||
      item.is_premium === 1 ||
      item.is_premium === "1",
    businessHours: parseBusinessHours(item.business_hours ?? item.businessHours),
    businessHoursDisplay: parseBusinessHoursDisplay(
      item.business_hours_display ?? item.businessHoursDisplay,
    ),
  };
}

function extractBusinessPayload(payload: unknown): unknown {
  const root = asRecord(payload);
  if (!root || root.success !== true) return null;
  const data = asRecord(root.data);
  return data?.business ?? null;
}

export class VendorBusinessNotFoundError extends Error {
  constructor(message = "No business profile found.") {
    super(message);
    this.name = "VendorBusinessNotFoundError";
  }
}

export async function fetchVendorBusinessProfile(): Promise<VendorBusinessProfile> {
  return loadVendorBusinessProfile();
}

export async function fetchVendorBusinessProfileForId(
  businessId: number,
): Promise<VendorBusinessProfile> {
  if (!Number.isFinite(businessId) || businessId <= 0) {
    throw new Error("A valid business id is required.");
  }
  return loadVendorBusinessProfile(businessId);
}

async function loadVendorBusinessProfile(businessId?: number): Promise<VendorBusinessProfile> {
  try {
    const params =
      businessId != null && businessId > 0 ? { business_id: businessId } : undefined;
    const res = await request.get("/vendor/business/show", { params });
    const root = asRecord(res.data);

    if (!root) {
      throw new Error("Failed to load business profile.");
    }

    if (root.success !== true) {
      const message = pickString(root, ["message"], "Failed to load business profile.");
      if (res.status === 404 || /no business profile/i.test(message)) {
        throw new VendorBusinessNotFoundError(message);
      }
      throw new Error(message);
    }

    const business = parseVendorBusinessProfile(extractBusinessPayload(res.data));
    if (!business) {
      throw new VendorBusinessNotFoundError();
    }

    return business;
  } catch (error) {
    if (error instanceof VendorBusinessNotFoundError) {
      throw error;
    }
    if (isAxiosError(error) && error.response?.status === 404) {
      const message =
        pickString(asRecord(error.response?.data) ?? {}, ["message"], "") ||
        "No business profile found.";
      throw new VendorBusinessNotFoundError(message);
    }
    throw error;
  }
}
