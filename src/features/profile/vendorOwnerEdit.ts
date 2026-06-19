import type { BusinessHourEntry } from '@/features/business/businessHours'
import { resolveSubcategoryFromServices } from '@/features/business/publicBusinessApi'
import type { SocialAccount } from '@/features/business/socialAccounts'
import type { UpdateVendorBusinessPayload } from '@/features/business/vendorBusinessApi'
import type { VendorBusinessProfile } from '@/features/business/vendorBusinessProfileApi'

export type OwnerProfilePatch = Partial<{
  business_name: string
  business_description: string
  phone: string
  whatsapp: string
  website: string
  street_address: string
  location_narrative: string
  latitude?: number
  longitude?: number
  google_place_id?: string
  services: string[]
  business_hours: BusinessHourEntry[]
  keep_cover_paths: string[]
  cover_photos: File[]
  logo: File | null
  category_id: number
  subcategory: string
  location_id: number
  location: string
  state: string
  city: string
  lga: string
  social_accounts: SocialAccount[]
}>

function resolveServicesForUpdate(
  profile: VendorBusinessProfile,
  patch?: string[],
): string[] {
  const services = (patch ?? profile.services).map((service) => service.trim()).filter(Boolean)
  if (services.length > 0) {
    return services
  }

  const category = profile.categoryName.trim()
  return category ? [`${category} services`] : ['General services']
}

function resolveSubcategoryForUpdate(
  profile: VendorBusinessProfile,
  services: string[],
  patch: OwnerProfilePatch,
): string | undefined {
  const categoryId = patch.category_id ?? profile.categoryId
  const allowed =
    categoryId === profile.categoryId ? (profile.categorySubcategories ?? []) : []

  if (patch.subcategory !== undefined) {
    const trimmed = patch.subcategory.trim()
    if (trimmed) return trimmed
    if (allowed.length === 0) return undefined
  }

  if (allowed.length === 0) return undefined

  const profileSub = profile.subcategory?.trim()
  if (profileSub && allowed.includes(profileSub)) return profileSub

  return resolveSubcategoryFromServices(allowed, services) ?? allowed[0]
}

function resolveOptionalId(
  patchValue: number | undefined,
  profileValue: number,
): number | undefined {
  if (patchValue !== undefined) {
    return patchValue > 0 ? patchValue : undefined
  }

  return profileValue > 0 ? profileValue : undefined
}

export function buildUpdatePayload(
  profile: VendorBusinessProfile,
  patch: OwnerProfilePatch,
): UpdateVendorBusinessPayload {
  const services = resolveServicesForUpdate(profile, patch.services)
  const subcategory = resolveSubcategoryForUpdate(profile, services, patch)
  const categoryId = resolveOptionalId(patch.category_id, profile.categoryId)
  const locationId = resolveOptionalId(patch.location_id, profile.locationId)

  const payload: UpdateVendorBusinessPayload = {
    business_id: profile.id,
    business_name: patch.business_name ?? profile.businessName,
    location: patch.location ?? profile.locationFullName,
    state: patch.state ?? profile.state,
    city: patch.city ?? profile.city,
    lga: patch.lga ?? profile.lga,
    business_description: patch.business_description ?? profile.description,
    phone: patch.phone ?? profile.phone,
    whatsapp: (patch.whatsapp ?? profile.whatsapp)?.trim() || undefined,
    website: (patch.website ?? profile.website)?.trim() || undefined,
    full_address: (patch.street_address ?? profile.streetAddress)?.trim() || undefined,
    street_address: (patch.street_address ?? profile.streetAddress)?.trim() || undefined,
    location_narrative:
      patch.location_narrative !== undefined
        ? patch.location_narrative.trim() || undefined
        : profile.locationNarrative?.trim() || undefined,
    latitude: patch.latitude ?? profile.latitude ?? undefined,
    longitude: patch.longitude ?? profile.longitude ?? undefined,
    google_place_id: patch.google_place_id ?? profile.googlePlaceId ?? undefined,
    services,
    social_accounts: patch.social_accounts ?? profile.socialAccounts,
    business_hours: patch.business_hours ?? profile.businessHours,
  }

  if (categoryId !== undefined) {
    payload.category_id = String(categoryId)
    payload.subcategory = subcategory
  } else if (subcategory) {
    payload.subcategory = subcategory
  }

  if (locationId !== undefined) {
    payload.location_id = String(locationId)
  }

  if (patch.keep_cover_paths !== undefined || patch.cover_photos !== undefined) {
    payload.keep_cover_paths = patch.keep_cover_paths ?? profile.coverPhotoPaths
    payload.cover_photos = patch.cover_photos
  }

  if (patch.logo) {
    payload.logo = patch.logo
  }

  return payload
}
