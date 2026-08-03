export type SeoPageDto = {
  id: number
  path: string
  pageName: string
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string | null
  canonicalUrl: string | null
  noindex: boolean
  ogImage: string | null
  changefreq: string | null
  priority: number | null
  updatedAt: string | null
}

/** @deprecated Prefer ResolvedSeoDto from /seo-pages/resolve */
export type SeoMetaPublicDto = {
  path: string
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string | null
}

export type ResolvedSeoDto = {
  matchedEntity: "static" | "business" | "catalog_item" | null
  title: string
  description: string | null
  keywords: string | null
  canonical: string
  robots: string
  og: Record<string, string>
  twitter: Record<string, string>
  jsonLd: unknown[]
}

export type SeoPagesPagination = {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}
