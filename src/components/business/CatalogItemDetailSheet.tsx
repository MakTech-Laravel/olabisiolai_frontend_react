import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, MessageCircle, Store } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  buildCatalogMessagePayload,
  prepareCatalogMessageWithImage,
  stashCatalogMessageDraft,
} from '@/features/catalog/catalogMessageContext'
import { formatCatalogPrice, type BusinessCatalogItem } from '@/features/catalog/businessCatalogApi'
import { useRequireAuthNavigate } from '@/features/auth/useRequireAuthNavigate'
import { seedNewConversationInCache } from '@/features/messaging/conversationCache'
import { startDirectConversationWithVendor } from '@/features/messaging/startDirectConversation'
import { directMessageTo } from '@/lib/directMessage'
import { showError } from '@/lib/sweetAlert'
import { cn } from '@/lib/utils'

type CatalogItemDetailSheetProps = {
  open: boolean
  item: BusinessCatalogItem | null
  businessInfoId: number
  businessName: string
  vendorUserUuid?: string | null
  fromPath: string
  showMessageBusiness?: boolean
  messagesPath?: '/messages' | '/user/messages'
  onClose: () => void
}

export function CatalogItemDetailSheet({
  open,
  item,
  businessInfoId,
  businessName,
  vendorUserUuid,
  fromPath,
  showMessageBusiness = true,
  messagesPath = '/messages',
  onClose,
}: CatalogItemDetailSheetProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { requireAuthNavigate, isAuthReady, isAuthenticated } = useRequireAuthNavigate()
  const [loading, setLoading] = useState(false)

  if (!open || !item) return null

  const priceLabel = formatCatalogPrice(item)

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
      onClose()
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
        onClose()
      } catch (err) {
        const message =
          err instanceof Error && err.message ? err.message : 'Could not start conversation'
        showError(message)
      } finally {
        setLoading(false)
      }
    })()
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center lg:items-center lg:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="catalog-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-[rgba(8,12,18,0.45)]"
        aria-label="Close details"
        onClick={onClose}
      />

      <div
        className={cn(
          'relative z-10 flex w-full flex-col overflow-hidden bg-auth-bg text-ink',
          'h-[100dvh] max-h-[100dvh]',
          'lg:container lg:mx-auto lg:h-auto lg:max-h-[min(90dvh,820px)] lg:max-w-2xl lg:rounded-2xl lg:border lg:border-border-light lg:shadow-2xl',
        )}
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-border-light bg-white px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:rounded-t-2xl lg:pt-3">
          <button
            type="button"
            aria-label="Back to catalog"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-full transition-colors hover:bg-auth-bg"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
          <h2 id="catalog-detail-title" className="flex-1 text-center font-heading text-base font-bold">
            Details
          </h2>
          <div className="size-10" aria-hidden />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-visible pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-6">
          <div className="relative aspect-square w-full bg-border-light lg:aspect-[16/10] lg:max-h-[min(48vh,420px)]">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt="" className="size-full object-cover" />
            ) : (
              <div className="grid size-full place-items-center bg-gradient-to-br from-[#2e3b52] to-[#46587a] text-sm font-semibold uppercase tracking-wide text-white/80">
                {item.type}
              </div>
            )}
            <span
              className={cn(
                'absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                item.type === 'service' ? 'text-chat-accent' : 'text-brand',
              )}
            >
              {item.type}
            </span>
          </div>

          <div className="space-y-4 px-4 py-5 lg:px-6">
            <div>
              <h3 className="font-heading text-xl font-bold leading-snug text-ink lg:text-2xl">{item.name}</h3>
              <p className="mt-2 font-heading text-lg font-bold text-ink">{priceLabel}</p>
              {item.description ? (
                <p className="mt-3 text-[15px] leading-relaxed text-body-secondary lg:text-base">
                  {item.description}
                </p>
              ) : null}
            </div>

            {showMessageBusiness ? (
              <button
                type="button"
                disabled={loading}
                onClick={handleMessageBusiness}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#1e293b] px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(15,23,42,0.18)] transition-all hover:bg-[#273449] active:scale-[0.99] disabled:opacity-60 lg:py-4"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <MessageCircle className="size-4" aria-hidden />
                )}
                {loading ? 'Preparing enquiry…' : 'Message business'}
              </button>
            ) : null}

            <section className="rounded-2xl border border-border-light bg-white p-4 lg:p-5">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-stat-muted">
                About the business
              </h4>
              <div className="mt-3 flex items-start gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-full bg-[#e8f5ee] text-chat-accent">
                  <Store className="size-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="font-heading text-base font-bold text-ink">{businessName}</p>
                  <p className="mt-1 text-sm text-body-secondary">
                    Enquire about this {item.type} via direct message.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
