import { Navigate } from 'react-router-dom'

/**
 * Authenticated users should never be sent to vendor-only profile routes from login.
 */
export function VendorAuthRedirect() {
  return <Navigate to="/user/profile" replace />
}
