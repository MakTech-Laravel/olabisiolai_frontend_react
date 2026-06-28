import { businessProfilePath } from '@/lib/businessProfile'
import { resolveMediaUrl } from '@/lib/mediaUrl'

import {
  formatCatalogPrice,
  type BusinessCatalogItem,
  type CatalogItemType,
} from './businessCatalogApi'

const CATALOG_MARKER_OPEN = '[GIDIRA_CATALOG]'
const CATALOG_MARKER_CLOSE = '[/GIDIRA_CATALOG]'
const CATALOG_DRAFT_KEY = 'gidira.catalogMessageDraft'
const PENDING_CATALOG_PREFIX = 'gidira.pendingCatalog.'

/** In-memory cache for prefetched catalog image files (Files cannot live in sessionStorage). */
const pendingCatalogImageFiles = new Map<string, File>()

export function setPendingCatalogImageFile(conversationUuid: string, file: File): void {
  pendingCatalogImageFiles.set(conversationUuid, file)
}

export function takePendingCatalogImageFile(conversationUuid: string): File | null {
  const file = pendingCatalogImageFiles.get(conversationUuid) ?? null
  if (file) pendingCatalogImageFiles.delete(conversationUuid)
  return file
}

export function peekPendingCatalogForConversation(
  conversationUuid: string,
): CatalogMessagePayload | null {
  try {
    const raw = sessionStorage.getItem(`${PENDING_CATALOG_PREFIX}${conversationUuid}`)
    if (!raw) return null
    return JSON.parse(raw) as CatalogMessagePayload
  } catch {
    return null
  }
}

export function clearPendingCatalogForConversation(conversationUuid: string): void {
  try {
    sessionStorage.removeItem(`${PENDING_CATALOG_PREFIX}${conversationUuid}`)
  } catch {
    // ignore
  }
  pendingCatalogImageFiles.delete(conversationUuid)
}

export type CatalogMessagePayload = {
  v: 1
  businessName: string
  businessInfoId: number
  catalogUrl: string
  item: {
    id: number
    type: CatalogItemType
    name: string
    description: string | null
    priceDisplay: string
    imageUrl: string | null
  }
}

export type ParsedCatalogEnquiry = {
  catalog: CatalogMessagePayload
  userText: string
}

export function buildCatalogItemUrl(businessInfoId: number, itemId: number): string {
  const path = businessProfilePath(businessInfoId)
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path}?catalog=${itemId}`
  }
  return `${path}?catalog=${itemId}`
}

export function buildCatalogMessagePayload(
  businessInfoId: number,
  businessName: string,
  item: BusinessCatalogItem,
): CatalogMessagePayload {
  return {
    v: 1,
    businessName: businessName.trim(),
    businessInfoId,
    catalogUrl: buildCatalogItemUrl(businessInfoId, item.id),
    item: {
      id: item.id,
      type: item.type,
      name: item.name,
      description: item.description,
      priceDisplay: formatCatalogPrice(item),
      imageUrl: item.imageUrl,
    },
  }
}

export function buildCatalogEnquiryBody(
  catalog: CatalogMessagePayload,
  userText: string,
): string {
  const marker = `${CATALOG_MARKER_OPEN}${JSON.stringify(catalog)}${CATALOG_MARKER_CLOSE}`
  const trimmed = userText.trim()
  return trimmed ? `${marker}\n\n${trimmed}` : marker
}

export function parseCatalogEnquiryBody(body: string | null | undefined): ParsedCatalogEnquiry | null {
  if (!body?.includes(CATALOG_MARKER_OPEN)) return null

  const start = body.indexOf(CATALOG_MARKER_OPEN)
  const end = body.indexOf(CATALOG_MARKER_CLOSE, start)
  if (start === -1 || end === -1) return null

  const jsonRaw = body.slice(start + CATALOG_MARKER_OPEN.length, end)
  let catalog: CatalogMessagePayload
  try {
    catalog = JSON.parse(jsonRaw) as CatalogMessagePayload
  } catch {
    return null
  }

  if (!catalog?.item?.name || !catalog.businessName) return null

  const after = body.slice(end + CATALOG_MARKER_CLOSE.length).trim()
  const userText = after.startsWith('\n\n') ? after.slice(2).trim() : after

  return { catalog, userText }
}

export function catalogEnquiryPreviewText(body: string | null | undefined): string | null {
  const parsed = parseCatalogEnquiryBody(body)
  if (!parsed) return null
  const prefix = `Catalog: ${parsed.catalog.item.name}`
  return parsed.userText ? `${prefix} — ${parsed.userText}` : prefix
}

export function stashCatalogMessageDraft(payload: CatalogMessagePayload): void {
  try {
    sessionStorage.setItem(CATALOG_DRAFT_KEY, JSON.stringify(payload))
  } catch {
    // ignore quota errors
  }
}

export function takeCatalogMessageDraft(): CatalogMessagePayload | null {
  try {
    const raw = sessionStorage.getItem(CATALOG_DRAFT_KEY)
    sessionStorage.removeItem(CATALOG_DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CatalogMessagePayload
  } catch {
    return null
  }
}

export function setPendingCatalogForConversation(
  conversationUuid: string,
  payload: CatalogMessagePayload,
): void {
  try {
    sessionStorage.setItem(
      `${PENDING_CATALOG_PREFIX}${conversationUuid}`,
      JSON.stringify(payload),
    )
  } catch {
    // ignore
  }
}

export function takePendingCatalogForConversation(
  conversationUuid: string,
): CatalogMessagePayload | null {
  try {
    const key = `${PENDING_CATALOG_PREFIX}${conversationUuid}`
    const raw = sessionStorage.getItem(key)
    sessionStorage.removeItem(key)
    if (!raw) return null
    return JSON.parse(raw) as CatalogMessagePayload
  } catch {
    return null
  }
}

export function moveCatalogDraftToConversation(conversationUuid: string): CatalogMessagePayload | null {
  const draft = takeCatalogMessageDraft()
  if (!draft) return null
  setPendingCatalogForConversation(conversationUuid, draft)
  return draft
}

/** Derive a human-readable catalog title from an uploaded image filename. */
export function catalogTitleFromImageFile(file: File): string {
  const withoutExt = file.name.replace(/\.[^.]+$/, '').trim()
  const normalized = withoutExt.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
  return normalized || file.name.trim() || 'Catalog item'
}

export function catalogImageFileName(itemName: string, imageUrl: string | null): string {
  if (imageUrl) {
    try {
      const pathname = new URL(imageUrl, window.location.origin).pathname
      const segment = pathname.split('/').filter(Boolean).pop()
      if (segment && segment.includes('.')) {
        return decodeURIComponent(segment)
      }
    } catch {
      // fall through
    }
  }

  const safe = itemName.trim().replace(/\s+/g, '-').toLowerCase() || 'catalog-item'
  return `${safe}.jpg`
}

const IMAGE_FETCH_TIMEOUT_MS = 8000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(null), ms)
    void promise
      .then((value) => {
        window.clearTimeout(timer)
        resolve(value)
      })
      .catch(() => {
        window.clearTimeout(timer)
        resolve(null)
      })
  })
}

/** Try to build a File from a loaded image URL (works when the image is already cached in the browser). */
export async function fileFromImageUrl(imageUrl: string, itemName: string): Promise<File | null> {
  const url = resolveMediaUrl(imageUrl, '')
  if (!url) return null

  return withTimeout(
    new Promise<File | null>((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      const finish = (file: File | null) => resolve(file)

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            finish(null)
            return
          }
          ctx.drawImage(img, 0, 0)
          canvas.toBlob(
            (blob) => {
              if (!blob?.size) {
                finish(null)
                return
              }
              const type = blob.type || 'image/jpeg'
              finish(new File([blob], catalogImageFileName(itemName, url), { type }))
            },
            'image/jpeg',
            0.92,
          )
        } catch {
          finish(null)
        }
      }
      img.onerror = () => finish(null)
      img.src = url
    }),
    IMAGE_FETCH_TIMEOUT_MS,
  )
}

/** Download a catalog image so it can be attached in the message composer. */
export async function fetchCatalogImageFile(
  imageUrl: string,
  itemName: string,
): Promise<File | null> {
  const url = resolveMediaUrl(imageUrl, '')
  if (!url) return null

  const fromCache = await fileFromImageUrl(imageUrl, itemName)
  if (fromCache) return fromCache

  const attempts: RequestInit[] = [
    { mode: 'cors', credentials: 'omit' },
    { mode: 'cors', credentials: 'include' },
  ]

  for (const init of attempts) {
    try {
      const response = await withTimeout(fetch(url, init), IMAGE_FETCH_TIMEOUT_MS)
      if (!response?.ok) continue

      const blob = await response.blob()
      if (!blob.size) continue

      const fileName = catalogImageFileName(itemName, url)
      const type = blob.type && blob.type !== 'application/octet-stream' ? blob.type : 'image/jpeg'
      return new File([blob], fileName, { type })
    } catch {
      continue
    }
  }

  return null
}

/** Pre-fetch catalog image before opening chat (call from Message business click). */
export async function prepareCatalogMessageWithImage(
  conversationUuid: string,
  payload: CatalogMessagePayload,
): Promise<File | null> {
  setPendingCatalogForConversation(conversationUuid, payload)

  const imageUrl = payload.item.imageUrl
  if (!imageUrl) return null

  const file =
    (await fileFromImageUrl(imageUrl, payload.item.name)) ??
    (await fetchCatalogImageFile(imageUrl, payload.item.name))

  if (file) {
    setPendingCatalogImageFile(conversationUuid, file)
  }

  return file
}
