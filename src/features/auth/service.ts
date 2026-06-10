import {
  extractBearerTokenFromLoginBody,
  extractLoginVerificationChannel,
  extractRefreshTokenFromLoginBody,
  extractTwoFactorLoginToken,
  extractUserFromAuthPayload,
  isLoginVerificationRequired,
  isTwoFactorLoginRequired,
} from '@/api/laravelResponse'
import { request } from '@/api/request'
import { type AuthContextValue } from '@/auth/context'
import { rolePolicy } from '@/auth/rolePolicy'
import { getUserRoles } from '@/auth/roles'
import { setAccessToken, setRefreshToken, setStoredAuthUser } from '@/auth/token'
import { type AuthUser } from '@/auth/types'
import {
  type AdminLoginPayload,
  type AuthRole,
  type LoginPayload,
  type PasswordResetOtpPayload,
  type PhoneLoginRequestPayload,
  type PhoneVerifyOtpPayload,
  type RegisterPayload,
  type VerificationChannel,
  type VerifyOtpPayload,
} from '@/features/auth/types'

type AuthHandlers = Pick<
  AuthContextValue,
  'authStrategy' | 'setToken' | 'setUser' | 'refreshSession' | 'resetAuthState'
>

function pickOtpValue(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const record = data as Record<string, unknown>
  const direct = [record.otp, record.code, record.verification_code].find(
    (value): value is string => typeof value === 'string' && value.trim().length > 0,
  )
  if (direct) return direct

  const nestedData = record.data
  if (nestedData && typeof nestedData === 'object') {
    const nestedRecord = nestedData as Record<string, unknown>
    const nested = [nestedRecord.otp, nestedRecord.code, nestedRecord.verification_code].find(
      (value): value is string => typeof value === 'string' && value.trim().length > 0,
    )
    if (nested) return nested
  }

  return null
}

function logOtpFromResponse(data: unknown, context: string) {
  if (import.meta.env.DEV) {
    console.log(`[auth] ${context} raw response:`, data)
  }
  const otp = pickOtpValue(data)
  if (!otp) return
  console.log(`[auth] ${context} OTP:`, otp)
}

function ensureRoleMatchesExpected(user: unknown, expectedRole: AuthRole) {
  const roles = getUserRoles(extractUserFromAuthPayload(user))
  if (!roles.includes(expectedRole)) {
    throw new Error(
      `This account is not registered as ${expectedRole}. Please choose the correct account type.`,
    )
  }
}

async function hydrateSessionFromLoginBody(
  body: unknown,
  handlers: AuthHandlers,
  missingCookieMessage: string,
  missingTokenMessage: string,
) {
  const loggedInUser = extractUserFromAuthPayload(body)

  if (handlers.authStrategy === 'http_only_cookie') {
    const currentUser = await handlers.refreshSession()
    if (!currentUser) {
      throw new Error(missingCookieMessage)
    }
    return currentUser
  }

  const token = extractBearerTokenFromLoginBody(body)
  if (!token) {
    throw new Error(missingTokenMessage)
  }

  handlers.setToken(token)

  const refresh = extractRefreshTokenFromLoginBody(body)
  if (refresh) {
    setRefreshToken(refresh)
  }

  if (loggedInUser) {
    handlers.setUser(loggedInUser)
  }
  const refreshedUser = await handlers.refreshSession()
  // Prefer `/auth/profile` result so role stays correct; login JSON alone can be incomplete.
  return refreshedUser ?? loggedInUser
}

export type LoginUserResult =
  | { kind: 'authenticated'; user: AuthUser }
  | { kind: 'two_factor'; twoFactorToken: string }
  | {
      kind: 'verification_required'
      user: AuthUser
      verificationChannel: VerificationChannel
      email?: string
      phone?: string
    }

export function buildRegisterOtpVerificationPath(options: {
  role: AuthRole
  channel: VerificationChannel
  email?: string
  phone?: string
}): string {
  const params = new URLSearchParams({
    purpose: 'register',
    role: options.role,
    channel: options.channel,
  })
  if (options.channel === 'email' && options.email) {
    params.set('email', options.email)
  }
  if (options.channel === 'phone' && options.phone) {
    params.set('phone', options.phone)
  }
  return `/otp-verification?${params.toString()}`
}

export async function loginUserWithRole(
  payload: LoginPayload,
  handlers: AuthHandlers,
): Promise<LoginUserResult> {
  try {
    const res = await request.post<unknown>('/auth/login', payload)
    logOtpFromResponse(res.data, 'login verification')

    if (isLoginVerificationRequired(res.data)) {
      const user = await hydrateSessionFromLoginBody(
        res.data,
        handlers,
        'Unable to restore your session for account verification.',
        'Login response is missing access token.',
      )
      if (!user) {
        throw new Error('Unable to restore your session for account verification.')
      }
      ensureRoleMatchesExpected(user, payload.role)
      const verificationChannel = extractLoginVerificationChannel(res.data)
      return {
        kind: 'verification_required',
        user,
        verificationChannel,
        email: payload.email,
        phone: payload.phone,
      }
    }

    if (isTwoFactorLoginRequired(res.data)) {
      const twoFactorToken = extractTwoFactorLoginToken(res.data)
      if (!twoFactorToken) {
        throw new Error('Two-factor authentication is required, but the login token is missing.')
      }
      handlers.resetAuthState()
      return { kind: 'two_factor', twoFactorToken }
    }

    const user = await hydrateSessionFromLoginBody(
      res.data,
      handlers,
      'Unable to restore your session after login.',
      'Login response is missing access token.',
    )
    if (!user) {
      throw new Error('Unable to restore your session after login.')
    }
    ensureRoleMatchesExpected(user, payload.role)
    return { kind: 'authenticated', user }
  } catch (error) {
    handlers.resetAuthState()
    throw error
  }
}

export async function verifyLoginTwoFactor(
  payload: { two_factor_token: string; code: string; role: AuthRole },
  handlers: AuthHandlers,
): Promise<AuthUser> {
  try {
    const res = await request.post<unknown>('/auth/two-factor/verify', payload)
    const user = await hydrateSessionFromLoginBody(
      res.data,
      handlers,
      'Unable to restore your session after two-factor verification.',
      'Login response is missing access token.',
    )
    if (!user) {
      throw new Error('Unable to restore your session after two-factor verification.')
    }
    ensureRoleMatchesExpected(user, payload.role)
    return user
  } catch (error) {
    handlers.resetAuthState()
    throw error
  }
}

export async function loginAdmin(payload: AdminLoginPayload, handlers: AuthHandlers) {
  const paths = ["/admin/login", "/auth/admin/login"];
  let last: unknown = null;
  for (const path of paths) {
    try {
      const res = await request.post<unknown>(path, payload);
      return await hydrateSessionFromLoginBody(
        res.data,
        handlers,
        "Unable to restore your admin session.",
        "Admin login response is missing access token.",
      );
    } catch (e) {
      last = e;
    }
  }
  handlers.resetAuthState();
  throw last;
}

export async function requestPhoneLoginOtp(payload: PhoneLoginRequestPayload) {
  const res = await request.post<unknown>('/auth/phone/request-otp', payload)
  logOtpFromResponse(res.data, 'phone login request')
  return res.data
}

export async function resendPhoneLoginOtp(payload: PhoneLoginRequestPayload) {
  const res = await request.post<unknown>('/auth/phone/resend-otp', payload)
  logOtpFromResponse(res.data, 'phone login resend')
}

export async function verifyPhoneLoginOtp(
  payload: PhoneVerifyOtpPayload,
  handlers: AuthHandlers,
): Promise<LoginUserResult> {
  try {
    const res = await request.post<unknown>('/auth/phone/verify-otp', payload)

    if (isTwoFactorLoginRequired(res.data)) {
      const twoFactorToken = extractTwoFactorLoginToken(res.data)
      if (!twoFactorToken) {
        throw new Error('Two-factor authentication is required, but the login token is missing.')
      }
      handlers.resetAuthState()
      return { kind: 'two_factor', twoFactorToken }
    }

    const user = await hydrateSessionFromLoginBody(
      res.data,
      handlers,
      'Unable to restore your session after phone login.',
      'Login response is missing access token.',
    )
    if (!user) {
      throw new Error('Unable to restore your session after phone login.')
    }
    ensureRoleMatchesExpected(user, payload.role)
    return { kind: 'authenticated', user }
  } catch (error) {
    handlers.resetAuthState()
    throw error
  }
}

export async function registerUser(payload: RegisterPayload) {
  const res = await request.post<unknown>('/auth/register', payload)
  logOtpFromResponse(res.data, 'register')
}

export async function registerAndLoginUser(payload: RegisterPayload) {
  const res = await request.post<unknown>('/auth/register', payload)
  logOtpFromResponse(res.data, 'register')

  const token = extractBearerTokenFromLoginBody(res.data)
  const responseUser = extractUserFromAuthPayload(res.data)
  const contactId =
    payload.verification_channel === 'phone'
      ? (payload.phone ?? '')
      : (payload.email ?? '')

  const storedUser =
    responseUser ??
    ({
      id: contactId,
      email: payload.email,
      phone: payload.phone,
      role: payload.role,
      roles: [payload.role],
    } satisfies AuthUser)

  if (token) {
    setAccessToken(token)
    const refresh = extractRefreshTokenFromLoginBody(res.data)
    if (refresh) setRefreshToken(refresh)
  }
  setStoredAuthUser(storedUser)

  return storedUser
}

export async function requestPasswordResetOtp(payload: PasswordResetOtpPayload) {
  const res = await request.post<unknown>('/auth/forgot-password', payload)
  logOtpFromResponse(res.data, 'password reset')
}

export async function resendRegistrationOtp(payload: PasswordResetOtpPayload) {
  const res = await request.post<unknown>('/auth/otp/resend', payload)
  logOtpFromResponse(res.data, 'register resend')
}

export async function verifyRegistrationOtp(
  payload: VerifyOtpPayload,
  handlers: AuthHandlers,
  selectedRole: AuthRole,
) {
  const verifyPayload = {
    code: payload.otp,
    verification_code: payload.otp,
    ...(payload.email ? { email: payload.email } : {}),
    ...(payload.phone ? { phone: payload.phone } : {}),
    ...(payload.verification_channel ? { verification_channel: payload.verification_channel } : {}),
  }
  const res = await request.post<unknown>('/auth/otp/verify', verifyPayload)
  logOtpFromResponse(res.data, 'verify-otp')

  // Registration already writes the login token to storage.
  // OTP verification should validate/activate that session, not require a new token.
  if (handlers.authStrategy === 'http_only_cookie') {
    const currentUser = await handlers.refreshSession()
    if (!currentUser) {
      throw new Error('OTP verified, but we could not restore your session.')
    }
    return currentUser
  }

  const responseUser = extractUserFromAuthPayload(res.data)
  if (responseUser) {
    handlers.setUser(responseUser)
  }

  const refreshedUser = await handlers.refreshSession()
  const resolvedUser = refreshedUser ?? responseUser
  if (!resolvedUser) {
    // Some APIs verify OTP successfully but don't return user payload,
    // and profile endpoint may be unavailable. Keep role context so routing
    // can still proceed to the correct dashboard.
    const fallbackUser: AuthUser = {
      id: payload.email ?? payload.phone ?? 'unknown',
      email: payload.email,
      phone: payload.phone,
      role: selectedRole,
      roles: [selectedRole],
    }
    handlers.setUser(fallbackUser)
    return fallbackUser
  }
  return resolvedUser
}

export function resolveDashboardPath(user: unknown, selectedRole: AuthRole) {
  const roles = getUserRoles(extractUserFromAuthPayload(user))
  if (roles.includes('admin')) return '/admin'
  if (roles.includes('vendor')) return '/vendor/choose-your-plan'
  if (roles.includes('user')) return '/user/dashboard'

  const dashboardFromPolicy = roles
    .map((role) => rolePolicy[role]?.dashboard)
    .find((value): value is string => Boolean(value))

  if (dashboardFromPolicy) return dashboardFromPolicy
  return selectedRole === 'vendor' ? '/vendor/choose-your-plan' : '/user/dashboard'
}

/**
 * Post-login destination (vendor uses onboarding API so new vendors land on choose-your-plan, not dashboard).
 */
export async function resolvePostLoginPath(
  user: unknown,
  selectedRole: AuthRole,
): Promise<string> {
  const roles = getUserRoles(extractUserFromAuthPayload(user))
  const isVendor = roles.includes('vendor') || selectedRole === 'vendor'

  if (isVendor) {
    const { resolveVendorPostLoginPath } = await import(
      '@/features/subscription/vendorOnboardingApi'
    )

    return resolveVendorPostLoginPath()
  }

  return resolveDashboardPath(user, selectedRole)
}
