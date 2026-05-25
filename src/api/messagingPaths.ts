/** Messaging API root: vendor/user use `/conversations`; admin panel uses `/admin/messaging/...`. */
export function messagingApiRoot(): string {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return '/admin/messaging'
  }

  return ''
}

export function messagingPath(segment: string): string {
  const root = messagingApiRoot()
  const path = segment.startsWith('/') ? segment : `/${segment}`
  return `${root}${path}`
}
