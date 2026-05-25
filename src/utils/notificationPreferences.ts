import type { UserSettingsPayload } from '@/api/userSettings'

export function readBool(v: unknown, fallback: boolean): boolean {
  if (typeof v === 'boolean') return v
  if (v === 1 || v === '1') return true
  if (v === 0 || v === '0') return false
  return fallback
}

export type NotificationChannelToggles = {
  email: boolean
  push: boolean
  whatsapp: boolean
}

export function notificationTogglesFromSettings(
  data: UserSettingsPayload | undefined,
): NotificationChannelToggles {
  if (!data) {
    return { email: true, push: true, whatsapp: true }
  }

  const notif =
    data.settings.notifications && typeof data.settings.notifications === 'object'
      ? (data.settings.notifications as Record<string, unknown>)
      : {}

  return {
    email: Boolean(data.profile.wants_marketing_emails),
    push: readBool(notif.push, true),
    whatsapp: readBool(notif.whatsapp, true),
  }
}
