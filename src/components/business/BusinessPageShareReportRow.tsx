import { useState } from 'react'
import { Flag, Share2 } from 'lucide-react'

import { ReportAbuseModal } from '@/components/Modal/ReportAbuseModal'
import { useRequireAuthNavigate } from '@/features/auth/useRequireAuthNavigate'
import { useClipboard } from '@/hooks/useClipboard'
import { showError, showSuccess } from '@/lib/sweetAlert'

type BusinessPageShareReportRowProps = {
  businessId: number
  businessName: string
  listingPath: string
  allowReport?: boolean
}

export function BusinessPageShareReportRow({
  businessId,
  businessName,
  listingPath,
  allowReport = true,
}: BusinessPageShareReportRowProps) {
  const { requireAuthNavigate, isAuthReady, isAuthenticated } = useRequireAuthNavigate()
  const { copy } = useClipboard()
  const [reportOpen, setReportOpen] = useState(false)

  async function handleShare() {
    const shareUrl =
      typeof window !== 'undefined' ? `${window.location.origin}${listingPath}` : listingPath

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: businessName,
          text: `Check out ${businessName} on Gidira`,
          url: shareUrl,
        })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }

    try {
      await copy(shareUrl)
      showSuccess('Page link copied')
    } catch {
      showError('Could not copy link. Please try again.')
    }
  }

  function handleReport() {
    if (!isAuthReady) return
    if (!isAuthenticated) {
      requireAuthNavigate(listingPath, { state: { from: listingPath } })
      return
    }
    setReportOpen(true)
  }

  return (
    <>
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => void handleShare()}
          className="flex flex-1 flex-col items-center gap-1.5 rounded-[13px] border-[1.5px] border-border-light bg-white px-1.5 py-3 text-[13px] font-semibold text-body-secondary transition-colors active:bg-auth-bg"
        >
          <Share2 className="size-[19px]" strokeWidth={2} aria-hidden />
          Share
        </button>
        {allowReport ? (
          <button
            type="button"
            onClick={handleReport}
            className="flex flex-1 flex-col items-center gap-1.5 rounded-[13px] border-[1.5px] border-border-light bg-white px-1.5 py-3 text-[13px] font-semibold text-body-secondary transition-colors active:bg-auth-bg"
          >
            <Flag className="size-[19px]" strokeWidth={2} aria-hidden />
            Report
          </button>
        ) : null}
      </div>
      <ReportAbuseModal
        open={reportOpen}
        businessId={businessId}
        businessName={businessName}
        onClose={() => setReportOpen(false)}
      />
    </>
  )
}
