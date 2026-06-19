import type { AuthUser } from '@/auth/types'
import { hasAnyRole } from '@/auth/roles'
import { userHasBusinessPages } from '@/features/profile/profileViewMode'

/** Personal accounts without a business page may start new direct threads. */
export function canInitiateDirectConversation(user: AuthUser | null): boolean {
  if (!user) return false
  if (hasAnyRole(user, 'admin')) return true
  if (hasAnyRole(user, 'vendor')) return false
  if (userHasBusinessPages(user)) return false
  return user.role === 'user'
}

/** Whether the viewer may open a DM to a business listing as themselves. */
export function canMessageBusinessListing(
  viewer: AuthUser | null,
  vendorUserId?: number | null,
): boolean {
  if (!viewer) return false
  if (vendorUserId != null && Number(viewer.id) === Number(vendorUserId)) return false
  if (hasAnyRole(viewer, 'vendor')) return false
  return viewer.role === 'user'
}

export const B2B_MESSAGING_DISABLED_REASON =
  'Business-to-business messaging is not allowed. Businesses can only reply to customer messages.'

export const VENDOR_CANNOT_INITIATE_REASON =
  'Businesses can only reply to customer messages. Wait for a customer to contact you first.'
