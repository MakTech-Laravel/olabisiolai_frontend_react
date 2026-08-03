import { useQuery } from "@tanstack/react-query"

import { fetchPublicSeoByPath } from "@/features/seo/publicSeoApi"
import type { SeoMetaPublicDto } from "@/features/seo/types"

function normalizeClientPath(pathname: string): string {
  if (!pathname || pathname === "/") return "/"
  const withSlash = pathname.startsWith("/") ? pathname : `/${pathname}`
  return withSlash.replace(/\/+$/, "") || "/"
}

export function useSeoMeta(pathname: string) {
  const path = normalizeClientPath(pathname)

  return useQuery<SeoMetaPublicDto | null>({
    queryKey: ["public", "seo", path],
    queryFn: () => fetchPublicSeoByPath(path),
    staleTime: 5 * 60_000,
    retry: false,
  })
}
