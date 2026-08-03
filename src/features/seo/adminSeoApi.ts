import { request } from "@/api/request"
import { laravelInnerData, parseSeoListResponse, parseSeoPageDto } from "@/features/seo/seoParsers"
import type { SeoPageDto, SeoPagesPagination } from "@/features/seo/types"

export async function adminListSeoPages(params?: {
  search?: string
  page?: number
  perPage?: number
}): Promise<{ pages: SeoPageDto[]; pagination: SeoPagesPagination }> {
  const res = await request.post("/admin/seo-pages", {
    search: params?.search?.trim() || undefined,
    page: params?.page ?? 1,
    per_page: params?.perPage ?? 20,
  })
  return parseSeoListResponse(res.data)
}

export async function adminUpdateSeoPage(payload: {
  id: number
  metaTitle: string
  metaDescription: string
  metaKeywords: string
}): Promise<SeoPageDto> {
  const res = await request.post("/admin/seo-pages/update", {
    id: payload.id,
    meta_title: payload.metaTitle.trim() || null,
    meta_description: payload.metaDescription.trim() || null,
    meta_keywords: payload.metaKeywords.trim() || null,
  })
  const inner = laravelInnerData(res.data) ?? {}
  const page = parseSeoPageDto(inner.page)
  if (!page) throw new Error("Invalid SEO update response")
  return page
}

export async function adminGenerateSitemap(): Promise<{ urls: number; chunks: number }> {
  const res = await request.post("/admin/seo-pages/generate-sitemap")
  const inner = laravelInnerData(res.data) ?? {}
  return {
    urls: Number(inner.urls ?? 0) || 0,
    chunks: Number(inner.chunks ?? 1) || 1,
  }
}
