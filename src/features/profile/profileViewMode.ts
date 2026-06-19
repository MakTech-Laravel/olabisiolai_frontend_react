import type { AuthUser } from '@/auth/types'

export type ProfileViewMode = 'public' | 'customer' | 'vendorOwner' | 'vendorToVendor'

export type ProfileModeCapabilities = {
  follow: boolean
  message: boolean
  save: boolean
  review: boolean
  report: boolean
  ownerTools: boolean
}

const CAPABILITIES: Record<ProfileViewMode, ProfileModeCapabilities> = {
  public: {
    follow: true,
    message: true,
    save: false,
    review: true,
    report: false,
    ownerTools: false,
  },
  customer: {
    follow: true,
    message: true,
    save: false,
    review: true,
    report: true,
    ownerTools: false,
  },
  vendorToVendor: {
    follow: false,
    message: false,
    save: false,
    review: false,
    report: true,
    ownerTools: false,
  },
  vendorOwner: {
    follow: false,
    message: false,
    save: false,
    review: false,
    report: false,
    ownerTools: true,
  },
}

export function getProfileModeCapabilities(mode: ProfileViewMode): ProfileModeCapabilities {
  return CAPABILITIES[mode]
}

/** @deprecated Social actions no longer depend on profile mode. Use userHasBusinessPages for management UI. */
export function resolveActiveProfileMode(user: AuthUser | null): 'customer' | 'vendor' {
  if (!user) return 'customer'
  return userHasBusinessPages(user) ? 'vendor' : 'customer'
}

export function userHasBusinessPages(user: AuthUser | null): boolean {
  if (!user) return false

  const settings = user.settings
  if (settings && typeof settings === 'object' && !Array.isArray(settings)) {
    const activeBusinessId = Number((settings as Record<string, unknown>).active_business_id ?? 0)
    if (Number.isFinite(activeBusinessId) && activeBusinessId > 0) {
      return true
    }
  }

  return user.role === 'vendor'
}

export function resolveProfileViewMode(
  viewer: AuthUser | null,
  profileOwnerUserId: number | null,
): ProfileViewMode {
  if (!viewer) {
    return 'public'
  }

  if (profileOwnerUserId != null && Number(viewer.id) === profileOwnerUserId) {
    return 'vendorOwner'
  }

  // Everyone browses listings as a personal user — business pages are not social identities.
  return 'customer'
}

export function isVendorProfileMode(mode: ProfileViewMode): boolean {
  return mode === 'vendorOwner'
}
