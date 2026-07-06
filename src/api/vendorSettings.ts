import { request } from '@/api/request'

export type VendorSettingsProfile = {
  first_name: string
  last_name: string
  contact_name: string
  email: string
  phone: string | null
  business_name: string | null
  logo_url: string | null
  email_verified_at?: string | null
  phone_verified_at?: string | null
  email_verified?: boolean
  email_verification_required?: boolean
  can_make_purchases?: boolean
}

export type VendorSettingsNotifications = {
  email: boolean
  sms: boolean
  whatsapp: boolean
}

export type VendorSettingsVerification = {
  verification_status: 'none' | 'pending' | 'approved'
  verification_status_label: string
  is_approved: boolean
  shows_verified_badge?: boolean
  is_flagged: boolean
}

export type VendorSettingsSubscription = {
  plan: 'free' | 'premium'
  plan_label: string
  status: 'active' | 'pending_payment' | 'expired' | 'trialing' | 'cancelled'
  status_label: string
  expires_at?: string | null
  expires_at_iso?: string | null
  is_expired?: boolean
  days_remaining?: number
  requires_payment: boolean
  can_pay_premium?: boolean
  is_premium_active?: boolean
  can_access_features: boolean
  shows_verified_badge: boolean
  is_trial?: boolean
  trial_ends_at?: string | null
  trial_days_remaining?: number
}

export type VendorSettingsPayload = {
  profile: VendorSettingsProfile
  security: { two_factor_enabled: boolean }
  notifications: VendorSettingsNotifications
  verification: VendorSettingsVerification
  subscription: VendorSettingsSubscription
  settings: Record<string, unknown>
}

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

export async function fetchVendorSettings(): Promise<VendorSettingsPayload> {
  const response = await request.get<ApiEnvelope<VendorSettingsPayload>>('/vendor/settings')
  const body = response.data
  if (!body?.success || !body.data) {
    throw new Error(body?.message || 'Could not load settings')
  }
  return body.data
}

export type PatchVendorSettingsBody = {
  first_name?: string
  last_name?: string
  business_name?: string
  phone?: string
  settings?: {
    notifications?: Partial<VendorSettingsNotifications>
  }
}

export type PatchVendorSettingsOptions = {
  logo?: File | null
}

function appendPatchVendorSettingsFormData(form: FormData, body: PatchVendorSettingsBody): void {
  if (body.first_name !== undefined && body.first_name.trim() !== '') {
    form.append('first_name', body.first_name.trim())
  }
  if (body.last_name !== undefined && body.last_name.trim() !== '') {
    form.append('last_name', body.last_name.trim())
  }
  if (body.business_name !== undefined && body.business_name.trim() !== '') {
    form.append('business_name', body.business_name.trim())
  }
  if (body.phone !== undefined && body.phone.trim() !== '') {
    form.append('phone', body.phone.trim())
  }

  const notifications = body.settings?.notifications
  if (notifications) {
    if (typeof notifications.email === 'boolean') {
      form.append('settings[notifications][email]', notifications.email ? '1' : '0')
    }
    if (typeof notifications.sms === 'boolean') {
      form.append('settings[notifications][sms]', notifications.sms ? '1' : '0')
    }
    if (typeof notifications.whatsapp === 'boolean') {
      form.append('settings[notifications][whatsapp]', notifications.whatsapp ? '1' : '0')
    }
  }
}

export async function patchVendorSettings(
  body: PatchVendorSettingsBody,
  options?: PatchVendorSettingsOptions,
): Promise<VendorSettingsPayload> {
  const image = options?.logo
  if (image) {
    const form = new FormData()
    form.append('_method', 'PATCH')
    appendPatchVendorSettingsFormData(form, body)
    form.append('logo', image)
    // PHP reliably parses multipart only on POST; Laravel honors _method=PATCH.
    const response = await request.post<ApiEnvelope<VendorSettingsPayload>>('/vendor/settings', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const resBody = response.data
    if (!resBody?.success || !resBody.data) {
      throw new Error(resBody?.message || 'Could not save settings')
    }
    return resBody.data
  }

  const response = await request.patch<ApiEnvelope<VendorSettingsPayload>>('/vendor/settings', body)
  const resBody = response.data
  if (!resBody?.success || !resBody.data) {
    throw new Error(resBody?.message || 'Could not save settings')
  }
  return resBody.data
}

export type ChangeVendorPasswordBody = {
  current_password: string
  password: string
  password_confirmation: string
}

export async function changeVendorPassword(body: ChangeVendorPasswordBody): Promise<void> {
  const response = await request.post<ApiEnvelope<null>>('/vendor/password', body)
  const resBody = response.data
  if (!resBody?.success) {
    throw new Error(resBody?.message || 'Could not update password')
  }
}
