import { type AuthRole } from '@/features/auth/types'

const AUTH_SELECTED_ROLE_STORAGE_KEY = 'auth:selectedRole'

export function isAuthRole(value: string | null | undefined): value is AuthRole {
  return value === 'user' || value === 'vendor'
}

export function getStoredAuthRole(): AuthRole | null {
  if (typeof window === 'undefined') return null
  try {
    const role = localStorage.getItem(AUTH_SELECTED_ROLE_STORAGE_KEY)
    return isAuthRole(role) ? role : null
  } catch {
    return null
  }
}

export function saveAuthRole(role: AuthRole) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(AUTH_SELECTED_ROLE_STORAGE_KEY, role)
  } catch {
    // ignore storage errors in private mode
  }
}

export function resolveAuthRole(queryRole: string | null | undefined): AuthRole {
  if (isAuthRole(queryRole)) return queryRole
  return getStoredAuthRole() ?? 'user'
}
