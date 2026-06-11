import { env } from '@/config/env'

export type RolePolicyEntry = {
  /** Where to send the user when they land in this role area. */
  dashboard?: string
  /** Where to redirect when role mismatch happens inside this area. */
  fallback?: string
  /** Optional: role-specific logout endpoint (path after API base URL). */
  logoutPath?: string
}

export type RolePolicy = Record<string, RolePolicyEntry>

export const defaultRolePolicy: RolePolicy = {
  admin: { dashboard: '/admin', fallback: '/admin/login' },
  vendor: { dashboard: '/vendor/dashboard', fallback: '/login' },
  user: { dashboard: '/user/dashboard', fallback: '/login' },
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v)
}

function parseEnvOverrides(v: unknown): RolePolicy {
  if (!isPlainObject(v)) return {}
  const out: RolePolicy = {}
  for (const [role, entry] of Object.entries(v)) {
    if (!isPlainObject(entry)) continue
    const dashboard = typeof entry.dashboard === 'string' ? entry.dashboard : undefined
    const fallback = typeof entry.fallback === 'string' ? entry.fallback : undefined
    const logoutPath = typeof entry.logoutPath === 'string' ? entry.logoutPath : undefined
    out[role] = { dashboard, fallback, logoutPath }
  }
  return out
}

export const rolePolicy: RolePolicy = {
  ...defaultRolePolicy,
  ...parseEnvOverrides(env.rolePolicyJson),
}

export function getRoleFallback(role: string) {
  return rolePolicy[role]?.fallback
}

export function getRoleDashboard(role: string) {
  return rolePolicy[role]?.dashboard
}

export function getRoleLogoutPath(role: string) {
  return rolePolicy[role]?.logoutPath
}

