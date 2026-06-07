export type AuthRole = 'user' | 'vendor'

export type LoginPayload = {
  email: string
  password: string
  role: AuthRole
}

export type AdminLoginPayload = {
  email: string
  password: string
}

export type VerificationChannel = 'email' | 'phone'

export type RegisterPayload = {
  first_name: string
  last_name: string
  verification_channel: VerificationChannel
  email?: string
  phone?: string
  password: string
  password_confirmation: string
  role: AuthRole
}

export type PhoneLoginRequestPayload = {
  phone: string
  role: AuthRole
}

export type PhoneVerifyOtpPayload = {
  phone: string
  code: string
  role: AuthRole
}

export type VerifyOtpPayload = {
  email?: string
  phone?: string
  otp: string
  verification_channel?: VerificationChannel
}

export type PasswordResetOtpPayload = {
  email: string
}
