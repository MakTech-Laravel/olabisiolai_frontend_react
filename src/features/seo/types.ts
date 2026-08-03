export type SeoPageDto = {
  id: number
  path: string
  pageName: string
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string | null
  changefreq: string | null
  priority: number | null
  updatedAt: string | null
}

export type SeoMetaPublicDto = {
  path: string
  metaTitle: string | null
  metaDescription: string | null
  metaKeywords: string | null
}

export type SeoPagesPagination = {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}
