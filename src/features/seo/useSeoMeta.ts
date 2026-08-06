import { useQuery } from "@tanstack/react-query"

import { fetchResolvedSeo } from "@/features/seo/publicSeoApi"
import type { ResolvedSeoDto } from "@/features/seo/types"

function normalizeClientPath(pathname: string): string {
  if (!pathname || pathname === "/") return "/"
  const withSlash = pathname.startsWith("/") ? pathname : `/${pathname}`
  return withSlash.replace(/\/+$/, "") || "/"
}

export function useResolvedSeo(pathname: string) {
  const path = normalizeClientPath(pathname)

  return useQuery<ResolvedSeoDto | null>({
    queryKey: ["public", "seo", "resolve", path],
    queryFn: () => fetchResolvedSeo(path),
    staleTime: 5 * 60_000,
    retry: false,
  })
}

/** @deprecated Use useResolvedSeo */
export function useSeoMeta(pathname: string) {
  return useResolvedSeo(pathname)
}
