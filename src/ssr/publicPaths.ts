/**
 * Paths that receive full Vite SSR (HTML body + SEO head).
 * Everything else gets a CSR index shell.
 */

const EXACT_SSR_PATHS = new Set([
  '/',
  '/about',
  '/contact',
  '/faq',
  '/business-tips',
  '/business-tips/photos-that-sell',
  '/business-tips/writing-a-compelling-description',
  '/business-tips/getting-more-positive-reviews',
  '/business-tips/responding-to-customer-enquiries',
  '/business-tips/marketing-beyond-gidira',
  '/business-tips/pricing-your-services-right',
  '/terms',
  '/privacy-policy',
  '/delete-account',
  '/cookies-policy',
  '/community-guidelines',
  '/vendor-agreement',
  '/refund-policy',
  '/careers',
  '/catalog',
  '/filters',
  '/service',
  '/vendor/choose-your-plan',
  '/vendor/premium-info',
])

const SSR_PREFIXES = [
  '/business-tips/',
  '/careers/',
  '/catalog/items/',
  '/businesses/',
] as const

export function normalizeRequestPath(pathname: string): string {
  if (!pathname || pathname === '/') return '/'
  const withSlash = pathname.startsWith('/') ? pathname : `/${pathname}`
  const noQuery = withSlash.split('?')[0] ?? withSlash
  return noQuery.replace(/\/+$/, '') || '/'
}

export function shouldSsrPath(pathname: string): boolean {
  const path = normalizeRequestPath(pathname)
  if (EXACT_SSR_PATHS.has(path)) return true
  return SSR_PREFIXES.some((prefix) => path.startsWith(prefix))
}
