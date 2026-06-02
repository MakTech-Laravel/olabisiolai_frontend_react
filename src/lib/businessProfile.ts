import { encryptId } from '@/lib/encryptId'

/** Public marketplace profile URL for a business listing. */
export function businessProfilePath(businessId: number): string {
  return `/businesses/${encryptId(businessId)}`
}

export type BusinessProfileNavState = {
  from?: string
  business?: {
    id: number
    name: string
    category: string
    subcategory?: string | null
    location: string
    latitude?: number | null
    longitude?: number | null
    rating: number
    reviews: number
    description: string
    image: string
    logoUrl?: string
    coverPhotoUrls?: string[]
    verified: boolean
    isFavorite?: boolean
    phone?: string | null
    whatsapp?: string | null
    website?: string | null
  }
}

export function businessProfileNavState(
  business: BusinessProfileNavState['business'],
  from?: string,
): BusinessProfileNavState | undefined {
  if (!business) return undefined
  return { from, business }
}
