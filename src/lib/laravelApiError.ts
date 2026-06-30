import { isAxiosError } from 'axios'

/** First useful message from Laravel `sendResponse` / validation errors. */
export function getLaravelErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback
  }
  const data = error.response?.data
  if (!data || typeof data !== 'object') {
    return fallback
  }
  const o = data as Record<string, unknown>
  if (typeof o.message === 'string' && o.message.trim()) {
    return o.message
  }
  const errors = o.errors
  if (errors && typeof errors === 'object') {
    for (const v of Object.values(errors as Record<string, unknown>)) {
      if (Array.isArray(v) && typeof v[0] === 'string') {
        return v[0]
      }
    }
  }
  const payload = o.data
  if (payload && typeof payload === 'object') {
    const nestedErrors = (payload as Record<string, unknown>).errors
    if (nestedErrors && typeof nestedErrors === 'object') {
      for (const v of Object.values(nestedErrors as Record<string, unknown>)) {
        if (Array.isArray(v) && typeof v[0] === 'string') {
          return v[0]
        }
      }
    }
  }
  return fallback
}
