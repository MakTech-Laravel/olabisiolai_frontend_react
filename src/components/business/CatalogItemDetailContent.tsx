import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, MessageCircle, Store } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  buildCatalogMessagePayload,
  prepareCatalogMessageWithImage,
  stashCatalogMessageDraft,
} from '@/features/catalog/catalogMessageContext'
import { formatCatalogPrice, type BusinessCatalogItem } from '@/features/catalog/businessCatalogApi'
import { useRequireAuthNavigate } from '@/features/auth/useRequireAuthNavigate'
import { seedNewConversationInCache } from '@/features/messaging/conversationCache'
import { startDirectConversationWithVendor } from '@/features/messaging/startDirectConversation'
import { CATALOG_IMAGE_ASPECT_CLASS } from '@/lib/businessImageLayout'
import { businessProfilePath } from '@/lib/businessProfile'
import { directMessageTo } from '@/lib/directMessage'
import { showError } from '@/lib/sweetAlert'
import { cn } from '@/lib/utils'

const SWIPE_THRESHOLD_PX = 48

export type CatalogItemDetailContentProps = {
  item: BusinessCatalogItem
  businessInfoId: number
  businessName: string
  vendorUserUuid?: string | null
  fromPath: string
  showMessageBusiness?: boolean
  messagesPath?: '/messages' | '/user/messages'
  onBack: () => void
  className?: string
}

export function CatalogItemDetailContent({
  item,
  businessInfoId,
  businessName,
  vendorUserUuid,
  fromPath,
  showMessageBusiness = true,
  messagesPath = '/messages',
  onBack,
  className,
}: CatalogItemDetailContentProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { requireAuthNavigate, isAuthReady, isAuthenticated } = useRequireAuthNavigate()
  const [loading, setLoading] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)
  const swipeStartX = useRef<number | null>(null)
  const swipeStartY = useRef<number | null>(null)

  const photos = useMemo(() => {
    const urls = item.imageUrls?.length
      ? item.imageUrls
      : item.imageUrl
        ? [item.imageUrl]
        : []
    return urls.filter((url) => typeof url === 'string' && url.trim().length > 0)
  }, [item])

  const hasMultiplePhotos = photos.length > 1
  const activePhoto = photos[photoIndex] ?? null

  useEffect(() => {
    setPhotoIndex(0)
  }, [item.id])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!hasMultiplePhotos) return
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setPhotoIndex((current) => (current - 1 + photos.length) % photos.length)
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        setPhotoIndex((current) => (current + 1) % photos.length)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [hasMultiplePhotos, photos.length])

  const priceLabel = formatCatalogPrice(item)

  const goPrev = () => {
    if (!hasMultiplePhotos) return
    setPhotoIndex((current) => (current - 1 + photos.length) % photos.length)
  }

  const goNext = () => {
    if (!hasMultiplePhotos) return
    setPhotoIndex((current) => (current + 1) % photos.length)
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!hasMultiplePhotos) return
    swipeStartX.current = event.clientX
    swipeStartY.current = event.clientY
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!hasMultiplePhotos || swipeStartX.current === null || swipeStartY.current === null) return

    const deltaX = event.clientX - swipeStartX.current
    const deltaY = event.clientY - swipeStartY.current
    swipeStartX.current = null
    swipeStartY.current = null

    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX || Math.abs(deltaX) < Math.abs(deltaY)) return
    if (deltaX < 0) goNext()
    else goPrev()
  }

  const handleMessageBusiness = () => {
    if (!showMessageBusiness || loading) return
    if (!isAuthReady) return

    const payload = buildCatalogMessagePayload(businessInfoId, businessName, item)

    if (!isAuthenticated) {
      stashCatalogMessageDraft(payload)
      requireAuthNavigate(
        directMessageTo(
          {
            from: fromPath,
            participantUserUuid: vendorUserUuid ?? undefined,
            businessInfoId,
          },
          messagesPath,
        ),
      )
      return
    }

    void (async () => {
      setLoading(true)
      try {
        const conv = await startDirectConversationWithVendor({
          vendorUserUuid,
          businessInfoId,
        })

        await prepareCatalogMessageWithImage(conv.uuid, payload)
        seedNewConversationInCache(queryClient, conv, 'personal')

        const search = new URLSearchParams()
        search.set('scope', 'personal')
        search.set('c', conv.uuid)

        navigate(
          {
            pathname: messagesPath,
            search: `?${search.toString()}`,
          },
          { state: { from: fromPath } },
        )
      } catch (err) {
        const message =
          err instanceof Error && err.message ? err.message : 'Could not start conversation'
        showError(message)
      } finally {
        setLoading(false)
      }
    })()
  }

  const messageButton = showMessageBusiness ? (
    <button
      type="button"
      disabled={loading}
      onClick={handleMessageBusiness}
      className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-ink px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(15,23,42,0.18)] transition-all hover:bg-[#273449] active:scale-[0.99] disabled:opacity-60 sm:py-4"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <MessageCircle className="size-4" aria-hidden />
      )}
      {loading ? 'Preparing enquiry…' : 'Message business'}
    </button>
  ) : null

  const gallery = (
    <div className="space-y-3">
      <div
        className={cn(
          'relative w-full select-none overflow-hidden bg-border-light',
          CATALOG_IMAGE_ASPECT_CLASS,
          'rounded-none lg:rounded-2xl',
        )}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          swipeStartX.current = null
          swipeStartY.current = null
        }}
      >
        {activePhoto ? (
          <img
            src={activePhoto}
            alt={item.name}
            draggable={false}
            className="size-full object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center bg-linear-to-br from-[#2e3b52] to-[#46587a] text-sm font-semibold uppercase tracking-wide text-white/80">
            {item.type}
          </div>
        )}

        <span
          className={cn(
            'absolute left-3 top-3 z-10 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm',
            item.type === 'service' ? 'text-chat-accent' : 'text-brand',
          )}
        >
          {item.type}
        </span>

        {hasMultiplePhotos ? (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={(event) => {
                event.stopPropagation()
                goPrev()
              }}
              className="absolute left-2 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white shadow-sm transition-colors hover:bg-black/70 sm:size-10"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={(event) => {
                event.stopPropagation()
                goNext()
              }}
              className="absolute right-2 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white shadow-sm transition-colors hover:bg-black/70 sm:size-10"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
            <span className="absolute bottom-3 right-3 z-10 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              {photoIndex + 1}/{photos.length}
            </span>
          </>
        ) : null}
      </div>

      {hasMultiplePhotos ? (
        <div className="flex gap-2 overflow-x-auto px-4 pb-1 [-webkit-overflow-scrolling:touch] scrollbar-hide sm:px-0">
          {photos.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              aria-label={`Show photo ${index + 1}`}
              aria-pressed={index === photoIndex}
              onClick={() => setPhotoIndex(index)}
              className={cn(
                'size-14 shrink-0 overflow-hidden rounded-xl border-2 transition-transform duration-200 sm:size-16',
                index === photoIndex
                  ? 'scale-[1.02] border-chat-accent shadow-sm'
                  : 'border-border-light opacity-80 hover:scale-[1.02] hover:opacity-100',
              )}
            >
              <img src={url} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )

  const details = (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold leading-snug tracking-tight text-ink sm:text-3xl">
          {item.name}
        </h2>
        <p className="mt-2 font-heading text-xl font-bold text-ink sm:text-2xl">{priceLabel}</p>
        {item.description ? (
          <p className="mt-3 text-[15px] leading-relaxed text-body-secondary sm:mt-4 sm:text-base">
            {item.description}
          </p>
        ) : null}
      </div>

      {messageButton}

      <Link
        to={businessProfilePath(businessInfoId)}
        className="block rounded-2xl border border-border-light bg-white p-4 shadow-[0_1px_2px_rgba(16,22,32,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:p-5"
      >
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stat-muted">
          About the business
        </h3>
        <div className="mt-3 flex items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e8f5ee] text-chat-accent">
            <Store className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="font-heading text-base font-bold text-ink hover:text-brand">
              {businessName}
            </p>
            <p className="mt-1 text-sm text-body-secondary">
              View profile · enquire about this {item.type} via direct message.
            </p>
          </div>
        </div>
      </Link>
    </div>
  )

  return (
    <div className={cn('bg-auth-bg text-ink', className)}>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border-light bg-white/95 px-3 py-3 backdrop-blur-md lg:hidden">
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="grid size-10 place-items-center rounded-full transition-colors hover:bg-auth-bg active:scale-95"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate font-heading text-base font-bold">Details</h1>
          <p className="truncate text-xs text-stat-muted">{item.name}</p>
        </div>
        <div className="size-10" aria-hidden />
      </header>

      {/* Mobile: stacked · Desktop: gallery left / details right */}
      <div
        className={cn(
          'lg:grid lg:grid-cols-2 lg:items-start lg:gap-8 lg:p-6 xl:gap-10 xl:p-8 mb-8 lg:mb-0',
          showMessageBusiness,
        )}
      >
        <div className="lg:sticky lg:top-6">{gallery}</div>
        <div className="px-4 pt-5 sm:px-6 lg:px-0 lg:pt-0">{details}</div>
      </div>

      {/* Mobile sticky CTA */}
      {showMessageBusiness ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border-light bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden pb-[max(0.75rem,env(safe-area-inset-bottom,0))]">
          <div className="mx-auto w-full max-w-lg">{messageButton}</div>
        </div>
      ) : null}
    </div>
  )
}
