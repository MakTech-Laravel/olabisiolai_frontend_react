/** Public business overview / about text (shown on profile Overview section). */
export const BUSINESS_OVERVIEW_MAX_LENGTH = 150

export const BUSINESS_SEARCH_MAX_LENGTH = 150

export function clampBusinessOverview(value: string): string {
  return value.slice(0, BUSINESS_OVERVIEW_MAX_LENGTH)
}

export function displayBusinessOverview(value: string): string {
  return clampBusinessOverview(value.trim())
}

export function businessOverviewLengthError(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Business overview is required.'
  if (trimmed.length > BUSINESS_OVERVIEW_MAX_LENGTH) {
    return `Overview must be ${BUSINESS_OVERVIEW_MAX_LENGTH} characters or fewer.`
  }
  return null
}
