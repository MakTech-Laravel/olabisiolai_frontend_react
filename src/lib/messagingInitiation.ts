import type { AuthUser } from '@/auth/types'
import { hasAnyRole } from '@/auth/roles'

/** Any signed-in user may start a direct thread with an active business listing. */
export function canInitiateDirectConversation(user: AuthUser | null): boolean {
  if (!user) return false
  if (hasAnyRole(user, 'admin')) return true
  return true
}

/** Whether the viewer may open a DM to a business listing as themselves. */
export function canMessageBusinessListing(
  viewer: AuthUser | null,
  vendorUserId?: number | null,
): boolean {
  if (!viewer) return false
  if (vendorUserId != null && Number(viewer.id) === Number(vendorUserId)) return false
  return true
}

export const B2B_MESSAGING_DISABLED_REASON =
  'You cannot message your own business listing.'

export const VENDOR_CANNOT_INITIATE_REASON =
  'Choose an active business listing to message.'
