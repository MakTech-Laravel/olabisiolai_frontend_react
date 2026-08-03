import { request } from "@/api/request"
import { laravelInnerData, parseSeoMetaPublic } from "@/features/seo/seoParsers"
import type { SeoMetaPublicDto } from "@/features/seo/types"

export async function fetchPublicSeoByPath(path: string): Promise<SeoMetaPublicDto | null> {
  try {
    const res = await request.get("/seo-pages/by-path", {
      params: { path },
      skipAuthRedirect: true,
    })
    const data = res.data as { success?: boolean; data?: unknown }
    if (data?.success === false) return null
    const inner = laravelInnerData(res.data) ?? data?.data ?? res.data
    return parseSeoMetaPublic(inner)
  } catch {
    return null
  }
}
