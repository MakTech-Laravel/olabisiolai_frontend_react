import { useEffect } from "react"
import { useLocation } from "react-router-dom"

import { useResolvedSeo } from "@/features/seo/useSeoMeta"

const DEFAULT_TITLE = "Gidira"
const JSON_LD_ATTR = "data-gidira-jsonld"

function upsertMetaName(name: string, content: string | null | undefined) {
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

function upsertCanonical(href: string | null | undefined) {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!href || !href.trim()) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement("link")
    el.setAttribute("rel", "canonical")
    document.head.appendChild(el)
  }
  el.setAttribute("href", href.trim())
}

function upsertJsonLd(blocks: unknown[]) {
  document.head.querySelectorAll(`script[${JSON_LD_ATTR}]`).forEach((n) => n.remove())
  for (const block of blocks) {
    const script = document.createElement("script")
    script.type = "application/ld+json"
    script.setAttribute(JSON_LD_ATTR, "1")
    script.textContent = JSON.stringify(block)
    document.head.appendChild(script)
  }
}

/**
 * Applies resolved SEO from GET /seo-pages/resolve for the current SPA path.
 */
export function DocumentHead() {
  const { pathname } = useLocation()
  const { data } = useResolvedSeo(pathname)

  useEffect(() => {
    if (!data) {
      document.title = DEFAULT_TITLE
      return
    }

    document.title = data.title?.trim() || DEFAULT_TITLE

    upsertMetaName("description", data.description)
    upsertMetaName("keywords", data.keywords)
    upsertMetaName("robots", data.robots)
    upsertCanonical(data.canonical)

    const ogKeys = new Set([
      ...Object.keys(data.og),
      "title",
      "description",
      "type",
      "url",
      "site_name",
      "image",
    ])
    for (const key of ogKeys) {
      upsertOg(`og:${key}`, data.og[key] ?? null)
    }

    const twKeys = new Set([...Object.keys(data.twitter), "card", "title", "description", "image"])
    for (const key of twKeys) {
      upsertMetaName(`twitter:${key}`, data.twitter[key] ?? null)
    }

    upsertJsonLd(data.jsonLd)

    return () => {
      document.title = DEFAULT_TITLE
      document.head.querySelectorAll(`script[${JSON_LD_ATTR}]`).forEach((n) => n.remove())
    }
  }, [data])

  return null
}
