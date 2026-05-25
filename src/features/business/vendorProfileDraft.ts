import { cloneBusinessHours } from "@/features/business/businessHours";
import type { BusinessHourEntry } from "@/features/business/businessHours";
import type { SocialAccount } from "@/features/business/socialAccounts";
import type { VendorBusinessProfile } from "@/features/business/vendorBusinessProfileApi";

export type VendorProfileDraft = {
  businessName: string;
  categoryId: string;
  subcategory: string;
  locationId: string;
  description: string;
  services: string[];
  phone: string;
  whatsapp: string;
  website: string;
  socialAccounts: SocialAccount[];
  logoFile: File | null;
  logoPreview: string;
  existingCoverUrls: string[];
  newCoverFiles: File[];
  newCoverPreviews: string[];
  businessHours: BusinessHourEntry[];
};

export function profileToDraft(profile: VendorBusinessProfile): VendorProfileDraft {
  return {
    businessName: profile.businessName,
    categoryId: profile.categoryId > 0 ? String(profile.categoryId) : "",
    subcategory: profile.subcategory ?? "",
    locationId: profile.locationId > 0 ? String(profile.locationId) : "",
    description: profile.description,
    services: profile.services.length > 0 ? [...profile.services] : [""],
    phone: profile.phone,
    whatsapp: profile.whatsapp,
    website: profile.website,
    socialAccounts: profile.socialAccounts.map((account) => ({ ...account })),
    logoFile: null,
    logoPreview: profile.logoUrl,
    existingCoverUrls: [...profile.coverPhotoUrls],
    newCoverFiles: [],
    newCoverPreviews: [],
    businessHours: cloneBusinessHours(profile.businessHours),
  };
}

export function totalCoverCount(draft: VendorProfileDraft): number {
  return draft.existingCoverUrls.length + draft.newCoverFiles.length;
}
