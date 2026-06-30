import { isAxiosError } from 'axios'
import {
  extractBearerTokenFromLoginBody,
  extractDeviceVerificationToken,
  extractLoginVerificationChannel,
  extractRefreshTokenFromLoginBody,
  extractTwoFactorLoginToken,
  extractTwoFactorDeliveryMeta,
  extractUserFromAuthPayload,
  isDeviceVerificationRequired,
  isLoginVerificationRequired,
  isTwoFactorLoginRequired,
} from '@/api/laravelResponse'
import { request } from '@/api/request'
import { type AuthContextValue } from '@/auth/context'
import { rolePolicy } from '@/auth/rolePolicy'
import { getUserRoles } from '@/auth/roles'
import { setRefreshToken, setStoredAuthUser } from '@/auth/token'
import { type AuthUser } from '@/auth/types'
import {
  type AdminLoginPayload,
  type AuthRole,
  type LoginPayload,
  type PasswordResetOtpPayload,
  type ResetPasswordPayload,
  type VerifyForgotPasswordOtpPayload,
  type PhoneLoginRequestPayload,
  type PhoneVerifyOtpPayload,
  type RegisterPayload,
  type VerificationChannel,
  type VerifyOtpPayload,
} from '@/features/auth/types'
import {
  buildPasswordResetOtpPath,
  clearPasswordResetSession,
  markPasswordResetOtpVerified,
  passwordResetContactPayload,
  savePasswordResetSession,
} from '@/features/auth/passwordResetStorage'
import {
  clearDeviceVerificationSession,
  getDeviceVerificationSession,
  saveDeviceVerificationSession,
} from '@/features/auth/deviceVerificationStorage'
import {
  clearTwoFactorLoginSession,
  saveTwoFactorLoginSession,
} from '@/features/auth/twoFactorLoginStorage'
import { resolveVendorPostLoginPath } from '@/features/subscription/vendorOnboardingApi'
import { toNigerianPhonePayload } from '@/lib/nigerianPhone'
import { getAuthDevicePayload } from '@/lib/deviceId'
import {
  saveVendorPlan,
  vendorPostVerificationPath,
  type VendorPlanChoice,
} from '@/features/vendor/vendorPlanStorage'

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
  if (roles.includes(expectedRole)) {
    return
  }

  const marketplaceRoles: AuthRole[] = ['user', 'vendor']
  if (
    marketplaceRoles.includes(expectedRole)
    && roles.some((role) => marketplaceRoles.includes(role as AuthRole))
  ) {
    return
  }

  throw new Error(
    `This account is not registered as ${expectedRole}. Please choose the correct account type.`,
  )
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
  | {
      kind: 'two_factor'
      twoFactorToken: string
      role?: AuthRole | 'admin'
      verificationChannel?: VerificationChannel
      maskedEmail?: string
      maskedPhone?: string
    }
  | {
      kind: 'device_verification'
      deviceVerificationToken: string
      verificationChannel: VerificationChannel
      email?: string
      phone?: string
    }
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

export function buildNewDeviceOtpVerificationPath(options: {
  role: AuthRole
  channel: VerificationChannel
  email?: string
  phone?: string
}): string {
  const params = new URLSearchParams({
    purpose: 'new_device',
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

function buildVerificationRequiredUser(
  payload: LoginPayload,
  body: unknown,
): AuthUser {
  const fromBody = extractUserFromAuthPayload(body)
  if (fromBody) return fromBody

  return {
    id: payload.email ?? payload.phone ?? 'unknown',
    email: payload.email,
    phone: payload.phone,
    role: payload.role,
    roles: [payload.role],
  }
}

function parseDeviceVerificationResult(
  body: unknown,
  payload: LoginPayload,
): LoginUserResult | null {
  if (!isDeviceVerificationRequired(body)) {
    return null
  }

  const deviceVerificationToken = extractDeviceVerificationToken(body)
  if (!deviceVerificationToken) {
    throw new Error('New device verification is required, but the verification token is missing.')
  }

  const verificationChannel = extractLoginVerificationChannel(body)

  saveDeviceVerificationSession({
    token: deviceVerificationToken,
    channel: verificationChannel,
    email: payload.email,
    phone: payload.phone,
    role: payload.role,
  })

  return {
    kind: 'device_verification',
    deviceVerificationToken,
    verificationChannel,
    email: payload.email,
    phone: payload.phone,
  }
}

function parseLoginVerificationResult(
  body: unknown,
  payload: LoginPayload,
): LoginUserResult | null {
  if (!isLoginVerificationRequired(body)) {
    return null
  }

  const user = buildVerificationRequiredUser(payload, body)
  ensureRoleMatchesExpected(user, payload.role)

  return {
    kind: 'verification_required',
    user,
    verificationChannel: extractLoginVerificationChannel(body),
    email: payload.email,
    phone: payload.phone,
  }
}

function parseTwoFactorLoginResult(
  body: unknown,
  role: AuthRole | 'admin',
): LoginUserResult | null {
  if (!isTwoFactorLoginRequired(body)) {
    return null
  }

  const twoFactorToken = extractTwoFactorLoginToken(body)
  if (!twoFactorToken) {
    throw new Error('Two-factor authentication is required, but the login token is missing.')
  }

  const delivery = extractTwoFactorDeliveryMeta(body)
  logOtpFromResponse(body, 'two factor login')

  saveTwoFactorLoginSession({
    token: twoFactorToken,
    role,
    verificationChannel: delivery.verificationChannel,
    maskedEmail: delivery.maskedEmail,
    maskedPhone: delivery.maskedPhone,
  })

  return {
    kind: 'two_factor',
    twoFactorToken,
    role,
    verificationChannel: delivery.verificationChannel,
    maskedEmail: delivery.maskedEmail,
    maskedPhone: delivery.maskedPhone,
  }
}

export async function loginUserWithRole(
  payload: LoginPayload,
  handlers: AuthHandlers,
): Promise<LoginUserResult> {
  const loginPayload = {
    ...payload,
    ...getAuthDevicePayload(),
    ...(payload.phone ? { phone: toNigerianPhonePayload(payload.phone) } : {}),
  }

  try {
    const res = await request.post<unknown>('/auth/login', loginPayload)
    logOtpFromResponse(res.data, 'login verification')

    const verificationResult = parseLoginVerificationResult(res.data, payload)
    if (verificationResult) {
      handlers.resetAuthState()
      return verificationResult
    }

    const deviceVerificationResult = parseDeviceVerificationResult(res.data, payload)
    if (deviceVerificationResult) {
      handlers.resetAuthState()
      return deviceVerificationResult
    }

    const twoFactorResult = parseTwoFactorLoginResult(res.data, payload.role)
    if (twoFactorResult) {
      handlers.resetAuthState()
      return twoFactorResult
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
    clearDeviceVerificationSession()
    return { kind: 'authenticated', user }
  } catch (error) {
    if (isAxiosError(error)) {
      const verificationResult = parseLoginVerificationResult(error.response?.data, payload)
      if (verificationResult) {
        handlers.resetAuthState()
        return verificationResult
      }

      const deviceVerificationResult = parseDeviceVerificationResult(error.response?.data, payload)
      if (deviceVerificationResult) {
        handlers.resetAuthState()
        return deviceVerificationResult
      }
    }

    handlers.resetAuthState()
    throw error
  }
}

export async function verifyLoginTwoFactor(
  payload: { two_factor_token: string; code: string; role: AuthRole },
  handlers: AuthHandlers,
): Promise<LoginUserResult> {
  try {
    const res = await request.post<unknown>('/auth/two-factor/verify', {
      ...payload,
      ...getAuthDevicePayload(),
    })

    const twoFactorResult = parseTwoFactorLoginResult(res.data, payload.role)
    if (twoFactorResult) {
      handlers.resetAuthState()
      return twoFactorResult
    }

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
    clearDeviceVerificationSession()
    clearTwoFactorLoginSession()
    return { kind: 'authenticated', user }
  } catch (error) {
    handlers.resetAuthState()
    throw error
  }
}

export async function resendTwoFactorLoginOtp(twoFactorToken: string, isAdmin = false) {
  const path = isAdmin ? '/auth/admin/two-factor/resend-otp' : '/auth/two-factor/resend-otp'
  const res = await request.post<unknown>(
    path,
    { two_factor_token: twoFactorToken },
    { skipAuthRedirect: true },
  )
  logOtpFromResponse(res.data, 'two factor login resend')
  return extractTwoFactorDeliveryMeta(res.data)
}

export async function resendNewDeviceLoginOtp(deviceVerificationToken: string) {
  const res = await request.post<unknown>(
    '/auth/device/resend-otp',
    { device_verification_token: deviceVerificationToken },
    { skipAuthRedirect: true },
  )
  logOtpFromResponse(res.data, 'new device login resend')
}

export async function verifyNewDeviceLoginOtp(
  payload: { code: string; role: AuthRole },
  handlers: AuthHandlers,
): Promise<LoginUserResult> {
  const session = getDeviceVerificationSession()
  if (!session?.token) {
    throw new Error('Your device verification session expired. Please sign in again.')
  }

  try {
    const res = await request.post<unknown>(
      '/auth/device/verify-otp',
      {
        device_verification_token: session.token,
        code: payload.code,
        role: payload.role,
      },
      { skipAuthRedirect: true },
    )

    const twoFactorResult = parseTwoFactorLoginResult(res.data, payload.role)
    if (twoFactorResult) {
      clearDeviceVerificationSession()
      handlers.resetAuthState()
      return twoFactorResult
    }

    const user = await hydrateSessionFromLoginBody(
      res.data,
      handlers,
      'Unable to restore your session after device verification.',
      'Login response is missing access token.',
    )
    if (!user) {
      throw new Error('Unable to restore your session after device verification.')
    }
    ensureRoleMatchesExpected(user, payload.role)
    clearDeviceVerificationSession()
    return { kind: 'authenticated', user }
  } catch (error) {
    handlers.resetAuthState()
    throw error
  }
}

export async function loginAdmin(payload: AdminLoginPayload, handlers: AuthHandlers): Promise<LoginUserResult> {
  const paths = ["/admin/login", "/auth/admin/login"];
  let last: unknown = null;
  for (const path of paths) {
    try {
      const res = await request.post<unknown>(path, payload);

      const twoFactorResult = parseTwoFactorLoginResult(res.data, 'admin');
      if (twoFactorResult) {
        handlers.resetAuthState();
        return twoFactorResult;
      }

      const user = await hydrateSessionFromLoginBody(
        res.data,
        handlers,
        "Unable to restore your admin session.",
        "Admin login response is missing access token.",
      );
      if (!user) {
        throw new Error("Unable to restore your admin session.");
      }
      return { kind: 'authenticated', user };
    } catch (e) {
      last = e;
    }
  }
  handlers.resetAuthState();
  throw last;
}

export async function verifyAdminLoginTwoFactor(
  payload: { two_factor_token: string; code: string },
  handlers: AuthHandlers,
): Promise<LoginUserResult> {
  try {
    const res = await request.post<unknown>('/auth/admin/two-factor/verify', payload);

    const user = await hydrateSessionFromLoginBody(
      res.data,
      handlers,
      'Unable to restore your admin session after two-factor verification.',
      'Admin login response is missing access token.',
    );
    if (!user) {
      throw new Error('Unable to restore your admin session after two-factor verification.');
    }
    clearTwoFactorLoginSession();
    return { kind: 'authenticated', user };
  } catch (error) {
    handlers.resetAuthState();
    throw error;
  }
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

    const twoFactorResult = parseTwoFactorLoginResult(res.data, payload.role)
    if (twoFactorResult) {
      handlers.resetAuthState()
      return twoFactorResult
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
  const apiPayload = {
    ...payload,
    ...(payload.phone ? { phone: toNigerianPhonePayload(payload.phone) } : {}),
  }
  const res = await request.post<unknown>('/auth/register', apiPayload)
  logOtpFromResponse(res.data, 'register')

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

  setStoredAuthUser(storedUser)

  return storedUser
}

function extractPasswordResetCredentials(body: unknown): { otp: string | null; token: string | null } {
  const pick = (record: Record<string, unknown>) => {
    const otp =
      (typeof record.Otp === 'string' && record.Otp) ||
      (typeof record.otp === 'string' && record.otp) ||
      null
    const token =
      (typeof record.Token === 'string' && record.Token) ||
      (typeof record.token === 'string' && record.token) ||
      null
    return { otp, token }
  }

  if (!body || typeof body !== 'object') {
    return { otp: null, token: null }
  }

  const root = body as Record<string, unknown>
  const direct = pick(root)
  if (direct.otp || direct.token) {
    return direct
  }

  if (root.data && typeof root.data === 'object') {
    return pick(root.data as Record<string, unknown>)
  }

  return { otp: null, token: null }
}

export async function requestPasswordResetOtp(payload: PasswordResetOtpPayload) {
  const apiPayload = {
    ...passwordResetContactPayload({
      channel: payload.channel,
      email: payload.email,
      phone: payload.phone,
      token: '',
      otpVerified: false,
    }),
  }

  const res = await request.post<unknown>('/auth/forgot-password', apiPayload)
  logOtpFromResponse(res.data, 'password reset')

  const { token } = extractPasswordResetCredentials(res.data)
  if (!token) {
    throw new Error('Password reset started, but the reset token is missing. Please try again.')
  }

  savePasswordResetSession({
    channel: payload.channel,
    email: payload.email,
    phone: payload.phone,
    token,
    otpVerified: false,
  })

  return { token }
}

export async function resendForgotPasswordOtp(payload: VerifyForgotPasswordOtpPayload) {
  const res = await request.post<unknown>(
    '/auth/forgot-password/resend-otp',
    {
      ...passwordResetContactPayload({
        channel: payload.channel,
        email: payload.email,
        phone: payload.phone,
        token: payload.token,
        otpVerified: false,
      }),
      token: payload.token,
    },
    { skipAuthRedirect: true },
  )
  logOtpFromResponse(res.data, 'password reset resend')
}

export async function verifyForgotPasswordOtp(payload: VerifyForgotPasswordOtpPayload) {
  await request.post<unknown>(
    '/auth/forgot-password/verify-otp',
    {
      ...passwordResetContactPayload({
        channel: payload.channel,
        email: payload.email,
        phone: payload.phone,
        token: payload.token,
        otpVerified: false,
      }),
      code: payload.code,
      token: payload.token,
    },
    { skipAuthRedirect: true },
  )
  markPasswordResetOtpVerified()
}

export async function resetPassword(payload: ResetPasswordPayload) {
  await request.post<unknown>(
    '/auth/reset-password',
    {
      ...passwordResetContactPayload({
        channel: payload.channel,
        email: payload.email,
        phone: payload.phone,
        token: payload.token,
        otpVerified: true,
      }),
      token: payload.token,
      password: payload.password,
      password_confirmation: payload.password_confirmation,
    },
    { skipAuthRedirect: true },
  )
  clearPasswordResetSession()
}

export { buildPasswordResetOtpPath }

export async function resendRegistrationOtp(payload: {
  email?: string
  phone?: string
}) {
  const apiPayload = {
    ...payload,
    ...(payload.phone ? { phone: toNigerianPhonePayload(payload.phone) } : {}),
  }
  const res = await request.post<unknown>('/auth/register/resend-otp', apiPayload, {
    skipAuthRedirect: true,
  })
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
    ...getAuthDevicePayload(),
    ...(payload.email ? { email: payload.email } : {}),
    ...(payload.phone ? { phone: toNigerianPhonePayload(payload.phone) } : {}),
    ...(payload.verification_channel ? { verification_channel: payload.verification_channel } : {}),
  }
  const res = await request.post<unknown>('/auth/otp/verify', verifyPayload, {
    skipAuthRedirect: true,
  })
  logOtpFromResponse(res.data, 'verify-otp')

  const refreshedToken = extractBearerTokenFromLoginBody(res.data)
  if (refreshedToken) {
    handlers.setToken(refreshedToken)
    const refresh = extractRefreshTokenFromLoginBody(res.data)
    if (refresh) {
      setRefreshToken(refresh)
    }
  }

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

export function resolveDashboardPath(user: unknown, _selectedRole: AuthRole) {
  const roles = getUserRoles(extractUserFromAuthPayload(user))
  if (roles.includes('admin')) return '/admin'
  if (roles.includes('vendor')) return '/user/profile'
  if (roles.includes('user')) return '/user/profile'

  const dashboardFromPolicy = roles
    .map((role) => rolePolicy[role]?.dashboard)
    .find((value): value is string => Boolean(value))

  if (dashboardFromPolicy) return dashboardFromPolicy
  return '/user/profile'
}

export async function resolvePostLoginPath(
  user: unknown,
  selectedRole: AuthRole,
  options?: { vendorPlan?: VendorPlanChoice | null },
): Promise<string> {
  const roles = getUserRoles(extractUserFromAuthPayload(user))
  const isVendor = roles.includes('vendor') || selectedRole === 'vendor'

  if (isVendor) {
    // Only the registration OTP flow passes an explicit plan — never reuse
    // localStorage during normal login.
    if (options?.vendorPlan) {
      saveVendorPlan(options.vendorPlan)
      return vendorPostVerificationPath(options.vendorPlan)
    }

    return resolveVendorPostLoginPath()
  }

  return resolveDashboardPath(user, selectedRole)
}
