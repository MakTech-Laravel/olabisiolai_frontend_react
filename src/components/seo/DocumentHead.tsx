import { useEffect } from "react"
import { useLocation } from "react-router-dom"

import { useSeoMeta } from "@/features/seo/useSeoMeta"

const DEFAULT_TITLE = "Gidira"

function upsertMeta(name: string, content: string | null | undefined) {
  const selector = `meta[name="${name}"]`
  let el = document.head.querySelector(selector) as HTMLMetaElement | null
  if (!content || !content.trim()) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute("name", name)
    document.head.appendChild(el)
  }
  el.setAttribute("content", content.trim())
}

function upsertOg(property: string, content: string | null | undefined) {
  const selector = `meta[property="${property}"]`
  let el = document.head.querySelector(selector) as HTMLMetaElement | null
  if (!content || !content.trim()) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute("property", property)
    document.head.appendChild(el)
  }
  el.setAttribute("content", content.trim())
}

/**
 * Applies SEO meta from the public API for the current SPA path.
 * Falls back to Gidira defaults when the API has no row / empty fields.
 */
export function DocumentHead() {
  const { pathname } = useLocation()
  const { data } = useSeoMeta(pathname)

  useEffect(() => {
    const title = data?.metaTitle?.trim() || DEFAULT_TITLE
    document.title = title

    upsertMeta("description", data?.metaDescription)
    upsertMeta("keywords", data?.metaKeywords)
    upsertOg("og:title", data?.metaTitle?.trim() || DEFAULT_TITLE)
    upsertOg("og:description", data?.metaDescription)

    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [data])

  return null
}
