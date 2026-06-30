import { request } from '@/api/request'

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

export type AdminTwoFactorStatus = {
  enabled: boolean
  confirmed: boolean
}

export async function fetchAdminTwoFactorStatus(): Promise<AdminTwoFactorStatus> {
  const response = await request.get<ApiEnvelope<AdminTwoFactorStatus>>('/admin/two-factor')
  const body = response.data
  if (!body?.success || !body.data) {
    throw new Error(body?.message || 'Could not load two-factor status.')
  }
  return body.data
}

export type EnableAdminTwoFactorResult = {
  secret: string
  qr_code: string
}

export async function enableAdminTwoFactor(): Promise<EnableAdminTwoFactorResult> {
  const response = await request.post<ApiEnvelope<EnableAdminTwoFactorResult>>('/admin/two-factor/enable')
  const body = response.data
  if (!body?.success || !body.data) {
    throw new Error(body?.message || 'Could not start two-factor setup.')
  }
  return body.data
}

export type ConfirmAdminTwoFactorResult = {
  enabled: boolean
  recovery_codes: string[]
}

export async function confirmAdminTwoFactor(code: string): Promise<ConfirmAdminTwoFactorResult> {
  const response = await request.post<ApiEnvelope<ConfirmAdminTwoFactorResult>>('/admin/two-factor/confirm', {
    code,
  })
  const body = response.data
  if (!body?.success || !body.data) {
    throw new Error(body?.message || 'Invalid authentication code.')
  }
  return body.data
}

export async function disableAdminTwoFactor(password: string): Promise<void> {
  const response = await request.delete<ApiEnvelope<{ enabled: boolean }>>('/admin/two-factor', {
    data: { password },
  })
  const body = response.data
  if (!body?.success) {
    throw new Error(body?.message || 'Could not disable two-factor authentication.')
  }
}
