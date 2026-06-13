const DEVICE_ID_STORAGE_KEY = 'react-vite-laravel.device_id'

function createDeviceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16)
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  try {
    const existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY)
    if (existing) {
      return existing
    }

    const next = createDeviceId()
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, next)
    return next
  } catch {
    return createDeviceId()
  }
}

export function getDeviceName(): string {
  if (typeof navigator === 'undefined') {
    return 'Unknown device'
  }

  const platform = navigator.platform?.trim()
  const userAgent = navigator.userAgent?.trim()
  if (platform && userAgent) {
    return `${platform} — ${userAgent}`.slice(0, 255)
  }

  return (userAgent || platform || 'Unknown device').slice(0, 255)
}

export function getAuthDevicePayload(): { device_id: string; device_name: string } {
  return {
    device_id: getDeviceId(),
    device_name: getDeviceName(),
  }
}
