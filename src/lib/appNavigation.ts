const AUTH_PREFIXES = [
  '/login',
  '/register',
  '/otp-verification',
  '/forget-password',
  '/reset-password',
  '/admin',
  '/vendor',
] as const

export function shouldShowAppBottomNav(pathname: string): boolean {
  if (AUTH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return false
  }

  return true
}

export function isBottomNavActive(pathname: string, target: string): boolean {
  if (target === '/') {
    return pathname === '/'
  }

  return pathname === target || pathname.startsWith(`${target}/`)
}
