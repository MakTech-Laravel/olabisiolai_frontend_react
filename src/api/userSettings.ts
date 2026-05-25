import { request } from '@/api/request'

/** `profile` lives on `users`; `settings` is the JSON column (arbitrary keys, merged on PATCH). */
export type UserSettingsProfile = {
  first_name: string
  last_name: string
  name: string
  email: string
  phone: string | null
  wants_marketing_emails: boolean
  location?: string | null
  image_path?: string | null
  image_url?: string | null
}

export type UserSettingsPayload = {
  profile: UserSettingsProfile
  /** Dynamic preferences — stored in `users.settings` (JSON). */
  settings: Record<string, unknown>
}

type UserSettingsApiEnvelope = {
  success: boolean
  message: string
  data: UserSettingsPayload
}

/** `GET /user/settings` — authenticated customer or vendor. */
export async function fetchUserSettings(): Promise<UserSettingsPayload> {
  const response = await request.get<UserSettingsApiEnvelope>('/user/settings')
  const body = response.data
  if (!body?.success || !body.data) {
    throw new Error(body?.message || 'Could not load settings')
  }
  return body.data
}

export type PatchUserSettingsBody = {
  first_name?: string
  last_name?: string
  phone?: string | null
  location?: string | null
  wants_marketing_emails?: boolean
  /** Shallow-deep merge via `array_replace_recursive` on the server. */
  settings?: Record<string, unknown>
}

function appendPatchUserSettingsFormData(form: FormData, body: PatchUserSettingsBody): void {
  if (body.first_name !== undefined) form.append('first_name', body.first_name)
  if (body.last_name !== undefined) form.append('last_name', body.last_name)
  if (body.phone !== undefined) form.append('phone', body.phone ?? '')
  if (body.location !== undefined) form.append('location', body.location ?? '')
  if (body.wants_marketing_emails !== undefined) {
    form.append('wants_marketing_emails', body.wants_marketing_emails ? '1' : '0')
  }

  const notifications = body.settings?.notifications
  if (notifications && typeof notifications === 'object') {
    const n = notifications as Record<string, unknown>
    if (typeof n.email === 'boolean') {
      form.append('settings[notifications][email]', n.email ? '1' : '0')
    }
    if (typeof n.push === 'boolean') {
      form.append('settings[notifications][push]', n.push ? '1' : '0')
    }
    if (typeof n.sms === 'boolean') {
      form.append('settings[notifications][sms]', n.sms ? '1' : '0')
    }
    if (typeof n.whatsapp === 'boolean') {
      form.append('settings[notifications][whatsapp]', n.whatsapp ? '1' : '0')
    }
  }
}

export type PatchUserSettingsOptions = {
  image?: File | null
}

/** `PATCH /user/settings` — partial profile + partial `settings` merge. */
export async function patchUserSettings(
  body: PatchUserSettingsBody,
  options?: PatchUserSettingsOptions,
): Promise<UserSettingsPayload> {
  const image = options?.image
  if (image) {
    const form = new FormData()
    appendPatchUserSettingsFormData(form, body)
    form.append('image', image)
    // PHP/nginx on production only parse multipart file uploads on POST, not PATCH.
    const response = await request.post<UserSettingsApiEnvelope>('/user/settings', form)
    const resBody = response.data
    if (!resBody?.success || !resBody.data) {
      throw new Error(resBody?.message || 'Could not save settings')
    }
    return resBody.data
  }

  const response = await request.patch<UserSettingsApiEnvelope>('/user/settings', body)
  const resBody = response.data
  if (!resBody?.success || !resBody.data) {
    throw new Error(resBody?.message || 'Could not save settings')
  }
  return resBody.data
}
