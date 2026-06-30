import { type AuthUser } from '@/auth/types'

function permissionNamesFromRaw(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const x of raw) {
    if (typeof x === 'string' && x) {
      out.push(x)
      continue
    }
    if (x && typeof x === 'object' && 'name' in x && typeof (x as { name: unknown }).name === 'string') {
      const n = (x as { name: string }).name
      if (n) out.push(n)
    }
  }
  return out
}

/** Map AdminResource / admin login payload into AuthUser with route role `admin` + Spatie fields. */
export function normalizeAdminAuthUser(raw: Record<string, unknown>): AuthUser {
  const spatieRoles = Array.isArray(raw.roles) ? permissionNamesFromRaw(raw.roles) : []
  const perms = permissionNamesFromRaw(raw.permissions)
  const { roles: _dropRoles, permissions: _dropPerms, ...rest } = raw
  const routeRoles = Array.from(new Set(['admin', ...spatieRoles]))
  const isSuper =
    raw.is_super_admin === true ||
    raw.is_super_admin === 1 ||
    raw.is_super_admin === '1' ||
    raw.is_super_admin === 'true'
  return {
    ...(rest as unknown as AuthUser),
    role: 'admin',
    roles: routeRoles,
    adminSpatieRoles: spatieRoles,
    permissions: perms,
    is_super_admin: isSuper ? true : raw.is_super_admin === false ? false : undefined,
  }
}

function rolesLookLikeSpatieAdmin(raw: unknown): boolean {
  if (!Array.isArray(raw)) return false
  return raw.some((x) => {
    const s = String(x)
    return s === 'admin' || s === 'super-admin' || s.endsWith('-admin')
  })
}

function isAdminResourceShape(o: Record<string, unknown>): boolean {
  if (typeof o.email !== 'string') return false
  // UserResource (user/vendor) always includes `role` and never sends Spatie `permissions`.
  const routeRole = o.role
  if (routeRole === 'user' || routeRole === 'vendor') return false
  if (rolesLookLikeSpatieAdmin(o.roles)) return true
  if (Array.isArray(o.permissions)) return true
  if (o.is_super_admin === true || o.is_super_admin === 1 || o.is_super_admin === '1') return true
  return false
}

/**
 * Typical Laravel `sendResponse($success, $message, $payload)` JSON:
 * `{ success?: boolean, message?: string, data?: T }`
 */
export function isLoginVerificationRequired(body: unknown): boolean {
  const data = unwrapLaravelData<Record<string, unknown>>(body)
  return (
    data?.verification_required === true ||
    data?.verification_status === 'unverified'
  )
}

export function extractLoginVerificationChannel(body: unknown): 'email' | 'phone' {
  const data = unwrapLaravelData<Record<string, unknown>>(body)
  return data?.verification_channel === 'phone' ? 'phone' : 'email'
}

export function isTwoFactorLoginRequired(body: unknown): body is {
  two_factor_required: true
  two_factor_token: string
} {
  const data = unwrapLaravelData<Record<string, unknown>>(body)
  return (
    data?.two_factor_required === true &&
    typeof data.two_factor_token === 'string' &&
    data.two_factor_token.length > 0
  )
}

export function extractTwoFactorLoginToken(body: unknown): string | null {
  if (!isTwoFactorLoginRequired(body)) return null
  const data = unwrapLaravelData<Record<string, unknown>>(body)
  return typeof data?.two_factor_token === 'string' ? data.two_factor_token : null
}

export function extractTwoFactorDeliveryMeta(body: unknown): {
  verificationChannel: 'email' | 'phone'
  maskedEmail?: string
  maskedPhone?: string
} {
  const data = unwrapLaravelData<Record<string, unknown>>(body)
  return {
    verificationChannel: data?.verification_channel === 'phone' ? 'phone' : 'email',
    maskedEmail: typeof data?.masked_email === 'string' ? data.masked_email : undefined,
    maskedPhone: typeof data?.masked_phone === 'string' ? data.masked_phone : undefined,
  }
}

export function isDeviceVerificationRequired(body: unknown): boolean {
  const data = unwrapLaravelData<Record<string, unknown>>(body)
  return (
    data?.device_verification_required === true ||
    data?.verification_status === 'device_verification_required'
  )
}

export function extractDeviceVerificationToken(body: unknown): string | null {
  const data = unwrapLaravelData<Record<string, unknown>>(body)
  return typeof data?.device_verification_token === 'string'
    ? data.device_verification_token
    : null
}

export function unwrapLaravelData<T = unknown>(body: unknown): T | null {
  if (body === null || body === undefined) return null
  if (typeof body !== 'object') return null
  const o = body as Record<string, unknown>
  if ('data' in o && o.data !== undefined) {
    return o.data as T
  }
  return body as T
}

function unwrapLaravelDataDeep(body: unknown): unknown {
  let cur: unknown = body
  for (let i = 0; i < 4; i++) {
    if (!cur || typeof cur !== 'object') return cur
    const o = cur as Record<string, unknown>
    if (!('data' in o)) return cur
    cur = o.data
  }
  return cur
}

/** Passport / your login payload: `token` or `access_token` at root or under `data`. */
export function extractBearerTokenFromLoginBody(body: unknown): string | null {
  if (body === null || body === undefined) return null
  if (typeof body !== 'object') return null
  const root = body as Record<string, unknown>
  const direct =
    (typeof root.token === 'string' && root.token) ||
    (typeof root.access_token === 'string' && root.access_token) ||
    null
  if (direct) return direct
  const inner = root.data
  if (inner && typeof inner === 'object') {
    const d = inner as Record<string, unknown>
    return (
      (typeof d.token === 'string' && d.token) ||
      (typeof d.access_token === 'string' && d.access_token) ||
      null
    )
  }
  return null
}

/** OAuth / Passport: `refresh_token` at root or under `data`. */
export function extractRefreshTokenFromLoginBody(body: unknown): string | null {
  if (body === null || body === undefined) return null
  if (typeof body !== 'object') return null
  const root = body as Record<string, unknown>
  const direct =
    (typeof root.refresh_token === 'string' && root.refresh_token) || null
  if (direct) return direct
  const inner = root.data
  if (inner && typeof inner === 'object') {
    const d = inner as Record<string, unknown>
    return (typeof d.refresh_token === 'string' && d.refresh_token) || null
  }
  return null
}

/** Map Laravel `UserResource` / user object from login or `/me`. */
export function extractUserFromAuthPayload(body: unknown): AuthUser | null {
  const data = unwrapLaravelDataDeep(body)
  if (!data || typeof data !== 'object') return null
  const o = data as Record<string, unknown>

  // Common: { data: { user: {...} } }
  if ('user' in o && o.user && typeof o.user === 'object') {
    const u = o.user as Record<string, unknown>
    if ('id' in u || 'email' in u) {
      if (isAdminResourceShape(u)) return normalizeAdminAuthUser(u)
      return u as unknown as AuthUser
    }
  }

  // Admin login often returns: { data: { admin: {...} } }
  if ('admin' in o && o.admin && typeof o.admin === 'object') {
    const a = o.admin as Record<string, unknown>
    if ('id' in a || 'email' in a) return normalizeAdminAuthUser(a)
  }

  // Sometimes: { data: {...user fields...} }
  if ('id' in o || 'email' in o) {
    if (isAdminResourceShape(o)) return normalizeAdminAuthUser(o)
    if (rolesLookLikeSpatieAdmin(o.roles)) return normalizeAdminAuthUser(o)
    return o as unknown as AuthUser
  }
  return null
}
