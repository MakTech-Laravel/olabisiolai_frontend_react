import { isSpatieSuperAdmin } from '@/auth/adminSpatie'
import { env, type RoleMode } from '@/config/env'
import { type AuthUser } from '@/auth/types'

export type Role = string

function impliedAdminRouteRole(user: AuthUser): boolean {
  if (user.role === 'admin') return true
  const spatie = user.adminSpatieRoles
  if (Array.isArray(spatie) && spatie.length > 0) return true
  const r = user.roles
  if (!Array.isArray(r)) return false
  return r.some((x) => x === 'admin' || x === 'super-admin' || x.endsWith('-admin'))
}

export function getUserRoles(user: AuthUser | null, mode: RoleMode = env.roleMode): Role[] {
  if (!user) return []

  const injectAdmin = impliedAdminRouteRole(user) ? (['admin'] as Role[]) : []

  if (mode === 'multi') {
    const roles = Array.isArray(user.roles) ? [...user.roles] : []
    const merged = [...injectAdmin, ...roles]
    if (typeof user.role === 'string' && user.role) merged.push(user.role)
    const uniq = Array.from(new Set(merged.filter(Boolean)))
    if (uniq.length > 0) return uniq
    return injectAdmin.length ? injectAdmin : []
  }

  if (typeof user.role === 'string' && user.role) {
    return Array.from(new Set([...injectAdmin, user.role].filter(Boolean)))
  }
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    return Array.from(new Set([...injectAdmin, user.roles[0]!].filter(Boolean)))
  }
  return injectAdmin
}

export function hasAnyRole(user: AuthUser | null, required: Role | Role[]) {
  const requiredList = Array.isArray(required) ? required : [required]
  if (requiredList.includes('admin') && isSpatieSuperAdmin(user)) return true
  const roles = getUserRoles(user)
  return requiredList.some((r) => roles.includes(r))
}

