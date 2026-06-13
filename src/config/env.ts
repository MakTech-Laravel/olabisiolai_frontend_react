function required(name: string) {
  const v = (import.meta.env as Record<string, string | undefined>)[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

export type AuthStrategy = 'bearer_memory' | 'http_only_cookie'

/** Where to keep the Bearer token when using Passport JSON (no HttpOnly cookie from API). */
export type BearerTokenPersistence = 'memory' | 'session' | 'local'

/** How to interpret roles on the user object. */
export type RoleMode = 'single' | 'multi'

/** Whether login pages are single (global) or role-specific. */
export type LoginMode = 'single' | 'multi'

export type LogoutMode = 'single' | 'multi'

function authStrategyFromEnv(): AuthStrategy {
  const raw = (import.meta.env.VITE_AUTH_STRATEGY as string | undefined)?.toLowerCase()
  if (raw === 'http_only_cookie' || raw === 'cookie') return 'http_only_cookie'
  return 'bearer_memory'
}

function bearerTokenPersistenceFromEnv(): BearerTokenPersistence {
  const raw = (import.meta.env.VITE_BEARER_TOKEN_STORAGE as string | undefined)?.toLowerCase()
  if (raw === 'memory' || raw === 'ram') return 'memory'
  if (raw === 'local' || raw === 'localstorage') return 'local'
  if (raw === 'session' || raw === 'sessionstorage') return 'session'
  // Default: shared across tabs in the same browser until logout
  return 'local'
}

function roleModeFromEnv(): RoleMode {
  const raw = (import.meta.env.VITE_ROLE_MODE as string | undefined)?.toLowerCase()
  if (raw === 'multi' || raw === 'multiple') return 'multi'
  return 'single'
}

function rolePolicyJsonFromEnv(): unknown | null {
  const raw = (import.meta.env.VITE_ROLE_POLICY_JSON as string | undefined)?.trim()
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function loginModeFromEnv(): LoginMode {
  const raw = (import.meta.env.VITE_LOGIN_MODE as string | undefined)?.toLowerCase()
  if (raw === 'multi' || raw === 'multiple') return 'multi'
  return 'single'
}

function logoutModeFromEnv(): LogoutMode {
  const raw = (import.meta.env.VITE_LOGOUT_MODE as string | undefined)?.toLowerCase()
  if (raw === 'multi' || raw === 'multiple') return 'multi'
  return 'single'
}

function refreshTokenConfigFromEnv() {
  const enabledFlag = import.meta.env.VITE_REFRESH_TOKEN_ENABLED === 'true'
  const path = (import.meta.env.VITE_AUTH_REFRESH_PATH as string | undefined)?.trim() ?? ''
  const key =
    (import.meta.env.VITE_REFRESH_TOKEN_BODY_KEY as string | undefined)?.trim() ||
    'refresh_token'
  const enabled = enabledFlag && path.length > 0
  return { enabled, path, bodyKey: key }
}

const refreshTokenEnv = refreshTokenConfigFromEnv()

function optionalViteString(name: string): string | undefined {
  const v = (import.meta.env as Record<string, string | undefined>)[name]?.trim()
  return v || undefined
}

export const env = {
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  // Vite only exposes env vars to the client when prefixed with VITE_
  apiBaseUrl: required('VITE_API_BASE_URL'),
  /** Flutterwave public key for client-side checkout (optional). */
  flutterwavePublicKey: (import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY as string | undefined) ?? '',
  /** Paystack public key for client-side checkout (optional). */
  paystackPublicKey: (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined) ?? '',
  /**
   * `bearer_memory` — Passport returns `token` in JSON; see `bearerTokenPersistence`.
   * `http_only_cookie` — Backend sets HttpOnly session cookie; no Bearer in JS.
   */
  authStrategy: authStrategyFromEnv(),
  /**
   * Only for `bearer_memory`. `local` (default) shares login across tabs until logout.
   * `session` = per-tab only. `memory` = never survives reload.
   */
  bearerTokenPersistence: bearerTokenPersistenceFromEnv(),
  /** Profile endpoint path (Laravel12 auth routes commonly use `/auth/profile`). */
  authMePath: import.meta.env.VITE_AUTH_ME_PATH ?? '/auth/profile',
  /** Logout endpoint path (Laravel12 auth routes commonly use `/auth/logout`). */
  authLogoutPath: import.meta.env.VITE_AUTH_LOGOUT_PATH ?? '/auth/logout',
  /** Role parsing: `single` uses `user.role`, `multi` uses `user.roles` (array) */
  roleMode: roleModeFromEnv(),
  /** Optional JSON overrides for role policy (fallback/dashboard mappings). */
  rolePolicyJson: rolePolicyJsonFromEnv(),
  /** Login pages mode: `single` redirects any authed user away from login; `multi` only redirects if the page matches their role. */
  loginMode: loginModeFromEnv(),
  /** Logout mode: `single` always uses `authLogoutPath`; `multi` can use rolePolicy logoutPath when present. */
  logoutMode: logoutModeFromEnv(),
  /**
   * When `true` **and** `authRefreshPath` is non-empty: POST refresh + retry on 401.
   * If disabled or path missing, refresh logic is not loaded.
   */
  refreshTokenEnabled: refreshTokenEnv.enabled,
  /** Path after `VITE_API_BASE_URL` (e.g. `/oauth/token` or `/refresh`) */
  authRefreshPath: refreshTokenEnv.path,
  /** JSON body field name for the refresh token (default `refresh_token`) */
  refreshTokenBodyKey: refreshTokenEnv.bodyKey,
  /** Google Maps JS API key (Places + map). Optional until admin location map is used. */
  googleMapsApiKey: optionalViteString('VITE_GOOGLE_MAPS_API_KEY'),
}
