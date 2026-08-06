import type {
  ResolvedSeoDto,
  SeoMetaPublicDto,
  SeoPageDto,
  SeoPagesPagination,
} from "@/features/seo/types"
import { laravelInnerData } from "@/features/categories/categoryParsers"

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null
  return value as Record<string, unknown>
}

function stringRecord(raw: unknown): Record<string, string> {
  const o = asRecord(raw)
  if (!o) return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === "string" && v.trim()) out[k] = v
  }
  return out
}

export function parseSeoPageDto(raw: unknown): SeoPageDto | null {
  const o = asRecord(raw)
  if (!o) return null

  const id = typeof o.id === "number" ? o.id : Number(o.id)
  if (!Number.isFinite(id)) return null

  const path = typeof o.path === "string" ? o.path : ""
  if (!path) return null

  return {
    id,
    path,
    pageName: typeof o.page_name === "string" ? o.page_name : path,
    metaTitle: typeof o.meta_title === "string" ? o.meta_title : null,
    metaDescription: typeof o.meta_description === "string" ? o.meta_description : null,
    metaKeywords: typeof o.meta_keywords === "string" ? o.meta_keywords : null,
    canonicalUrl: typeof o.canonical_url === "string" ? o.canonical_url : null,
    noindex: Boolean(o.noindex),
    ogImage: typeof o.og_image === "string" ? o.og_image : null,
    changefreq: typeof o.changefreq === "string" ? o.changefreq : null,
    priority: typeof o.priority === "number" ? o.priority : o.priority != null ? Number(o.priority) : null,
    updatedAt: typeof o.updated_at === "string" ? o.updated_at : null,
  }
}

export function parseSeoMetaPublic(raw: unknown): SeoMetaPublicDto | null {
  const o = asRecord(raw)
  if (!o) return null
  const path = typeof o.path === "string" ? o.path : ""
  if (!path) return null

  return {
    path,
    metaTitle: typeof o.meta_title === "string" ? o.meta_title : null,
    metaDescription: typeof o.meta_description === "string" ? o.meta_description : null,
    metaKeywords: typeof o.meta_keywords === "string" ? o.meta_keywords : null,
  }
}

export function parseResolvedSeo(raw: unknown): ResolvedSeoDto | null {
  const o = asRecord(raw)
  if (!o) return null

  const title = typeof o.title === "string" ? o.title : "Gidira"
  const matched = o.matched_entity
  const matchedEntity =
    matched === "static" || matched === "business" || matched === "catalog_item" ? matched : null

  return {
    matchedEntity,
    title,
    description: typeof o.description === "string" ? o.description : null,
    keywords: typeof o.keywords === "string" ? o.keywords : null,
    canonical: typeof o.canonical === "string" ? o.canonical : "",
    robots: typeof o.robots === "string" ? o.robots : "index,follow",
    og: stringRecord(o.og),
    twitter: stringRecord(o.twitter),
    jsonLd: Array.isArray(o.json_ld) ? o.json_ld : [],
  }
}

export function parseSeoListResponse(payload: unknown): {
  pages: SeoPageDto[]
  pagination: SeoPagesPagination
} {
  const inner = laravelInnerData(payload) ?? asRecord(payload) ?? {}
  const pagesRaw = Array.isArray(inner.pages) ? inner.pages : []
  const pages = pagesRaw.map(parseSeoPageDto).filter((p): p is SeoPageDto => p !== null)

  const pag = asRecord(inner.pagination) ?? {}
  return {
    pages,
    pagination: {
      currentPage: Number(pag.current_page ?? 1) || 1,
      lastPage: Number(pag.last_page ?? 1) || 1,
      perPage: Number(pag.per_page ?? 20) || 20,
      total: Number(pag.total ?? pages.length) || 0,
    },
  }
}

export { laravelInnerData }
