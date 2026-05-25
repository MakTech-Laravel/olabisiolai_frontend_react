/**
 * Laravel / Sanctum often exposes a readable `XSRF-TOKEN` cookie (not HttpOnly).
 * Send it as `X-XSRF-TOKEN` on mutating requests when the cookie exists.
 */
function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function getXsrfTokenFromCookie(): string | null {
  return readCookie('XSRF-TOKEN')
}
