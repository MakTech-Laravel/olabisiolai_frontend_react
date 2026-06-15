import type { VendorBusinessProfile } from '@/features/business/vendorBusinessProfileApi'

export function verificationChipLabel(status: string): string {
  const normalized = status.toLowerCase()
  if (normalized === 'verified' || normalized === 'approved') return 'Verified'
  if (normalized === 'pending' || normalized === 'submitted') return 'Pending'
  if (normalized === 'rejected') return 'Rejected'
  return 'Not verified'
}

export function isBusinessVerified(status: string): boolean {
  const normalized = status.toLowerCase()
  return normalized === 'verified' || normalized === 'approved'
}

export type ProfileHubBusiness = VendorBusinessProfile & {
  isPremiumActive?: boolean
  followersCount?: number
}
