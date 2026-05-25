import { type AuthUser } from '@/auth/types'

function normalizeRoleToken(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')
}

function roleListSaysSuperAdmin(names: string[] | undefined): boolean {
  if (!names?.length) return false
  return names.some((r) => {
    const n = normalizeRoleToken(String(r))
    return n === 'super-admin' || n === 'superadmin' || n.endsWith('super-admin')
  })
}

/** Spatie `super-admin` role — must bypass UI permission checks even if route role `admin` is missing from payload. */
export function isSpatieSuperAdmin(user: AuthUser | null): boolean {
  if (!user) return false
  if (user.is_super_admin === true) return true
  return (
    roleListSaysSuperAdmin(user.adminSpatieRoles) ||
    roleListSaysSuperAdmin(user.roles)
  )
}
