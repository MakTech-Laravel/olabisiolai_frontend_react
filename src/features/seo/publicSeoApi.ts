import { request } from "@/api/request"
import { laravelInnerData, parseResolvedSeo } from "@/features/seo/seoParsers"
import type { ResolvedSeoDto } from "@/features/seo/types"

export async function fetchResolvedSeo(path: string): Promise<ResolvedSeoDto | null> {
  try {
    const res = await request.get("/seo-pages/resolve", {
      params: { path },
      skipAuthRedirect: true,
    })
    const data = res.data as { success?: boolean; data?: unknown }
    if (data?.success === false) return null
    const inner = laravelInnerData(res.data) ?? data?.data ?? res.data
    return parseResolvedSeo(inner)
  } catch {
    return null
  }
}
