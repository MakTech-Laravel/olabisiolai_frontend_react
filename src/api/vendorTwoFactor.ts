import { request } from '@/api/request'

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

export type TwoFactorStatus = {
  enabled: boolean
  confirmed: boolean
}

export async function fetchTwoFactorStatus(): Promise<TwoFactorStatus> {
  const response = await request.get<ApiEnvelope<TwoFactorStatus>>('/vendor/two-factor')
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

export async function enableTwoFactor(): Promise<EnableTwoFactorResult> {
  const response = await request.post<ApiEnvelope<EnableTwoFactorResult>>('/vendor/two-factor/enable')
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

export async function confirmTwoFactor(code: string): Promise<ConfirmTwoFactorResult> {
  const response = await request.post<ApiEnvelope<ConfirmTwoFactorResult>>('/vendor/two-factor/confirm', {
    code,
  })
  const body = response.data
  if (!body?.success || !body.data) {
    throw new Error(body?.message || 'Invalid authentication code')
  }
  return body.data
}

export async function disableTwoFactor(password: string): Promise<void> {
  const response = await request.delete<ApiEnvelope<{ enabled: boolean }>>('/vendor/two-factor', {
    data: { password },
  })
  const body = response.data
  if (!body?.success) {
    throw new Error(body?.message || 'Could not disable two-factor authentication')
  }
}
