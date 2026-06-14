import type { AuthUser } from '@/auth/types'

export type ProfileViewMode = 'public' | 'customer' | 'vendorOwner' | 'vendorToVendor'

export type ActiveProfileMode = 'customer' | 'vendor'

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
    review: false,
    report: false,
    ownerTools: false,
  },
  customer: {
    follow: true,
    message: true,
    save: true,
    review: true,
    report: true,
    ownerTools: false,
  },
  vendorToVendor: {
    follow: true,
    message: true,
    save: true,
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

export function resolveActiveProfileMode(user: AuthUser | null): ActiveProfileMode {
  if (!user) return 'customer'

  const settings = user.settings
  if (settings && typeof settings === 'object' && !Array.isArray(settings)) {
    const active = (settings as Record<string, unknown>).active_profile_mode
    if (active === 'customer' || active === 'vendor') {
      return active
    }
  }

  return user.role === 'vendor' ? 'vendor' : 'customer'
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

  return resolveActiveProfileMode(viewer) === 'vendor' ? 'vendorToVendor' : 'customer'
}

export function isVendorProfileMode(mode: ProfileViewMode): boolean {
  return mode === 'vendorOwner' || mode === 'vendorToVendor'
}
