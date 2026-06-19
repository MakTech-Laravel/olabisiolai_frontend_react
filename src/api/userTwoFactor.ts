import { request } from '@/api/request'

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

export type TwoFactorStatus = {
  enabled: boolean
  confirmed?: boolean
}

export async function fetchUserTwoFactorStatus(): Promise<TwoFactorStatus> {
  const response = await request.get<ApiEnvelope<TwoFactorStatus>>('/user/two-factor')
  const body = response.data
  if (!body?.success || !body.data) {
    throw new Error(body?.message || 'Could not load two-factor status')
  }
  return body.data
}

export type EnableTwoFactorResult = {
  secret: string
  qr_code: string
}

export async function enableUserTwoFactor(): Promise<EnableTwoFactorResult> {
  const response = await request.post<ApiEnvelope<EnableTwoFactorResult>>('/user/two-factor/enable')
  const body = response.data
  if (!body?.success || !body.data) {
    throw new Error(body?.message || 'Could not start two-factor setup')
  }
  return body.data
}

export type ConfirmTwoFactorResult = {
  enabled: boolean
  recovery_codes: string[]
}

export async function confirmUserTwoFactor(code: string): Promise<ConfirmTwoFactorResult> {
  const response = await request.post<ApiEnvelope<ConfirmTwoFactorResult>>('/user/two-factor/confirm', {
    code,
  })
  const body = response.data
  if (!body?.success || !body.data) {
    throw new Error(body?.message || 'Could not confirm two-factor authentication')
  }
  return body.data
}

export async function disableUserTwoFactor(password: string): Promise<void> {
  const response = await request.delete<ApiEnvelope<{ enabled: boolean }>>('/user/two-factor', {
    data: { password },
  })
  const body = response.data
  if (!body?.success) {
    throw new Error(body?.message || 'Could not disable two-factor authentication')
  }
}
