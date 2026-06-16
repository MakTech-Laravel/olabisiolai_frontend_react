import { useQuery } from '@tanstack/react-query'
import { Copy, Gift, Share2 } from 'lucide-react'

import { fetchUserReferrals } from '@/api/referrals'
import { appOrigin } from '@/features/share/appShare'
import { showError, showSuccess } from '@/lib/sweetAlert'
import { cn } from '@/lib/utils'

type ProfileHubReferralCardProps = {
  className?: string
}

export function ProfileHubReferralCard({ className }: ProfileHubReferralCardProps) {
  const referralQuery = useQuery({
    queryKey: ['user', 'referrals'],
    queryFn: fetchUserReferrals,
    staleTime: 60_000,
  })

  const referralLink = referralQuery.data?.referral_link ?? ''
  const inviteCode = referralQuery.data?.code ?? ''

  async function copyLink() {
    if (!referralLink) return
    try {
      await navigator.clipboard.writeText(referralLink)
      showSuccess('Referral link copied.')
    } catch {
      showError('Could not copy link. Try again.')
    }
  }

  async function shareLink() {
    if (!referralLink) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Gidira',
          text: 'Sign up on Gidira with my link and get verified — I earn ₦1,000 when you verify.',
          url: referralLink,
        })
        return
      } catch {
        // fall through to copy
      }
    }
    await copyLink()
  }

  return (
    <div
      className={cn(
        'rounded-[16px] border border-border-light bg-white p-4 shadow-[0_1px_2px_rgba(16,22,32,0.05)]',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F6EF] text-[#13a36b]">
          <Gift className="size-5" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <b className="block text-[15px] font-semibold text-ink">Refer & earn ₦1,000</b>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-chat-meta">
            Share your link. You earn ₦1,000 when someone joins and gets verified.
          </p>
          {inviteCode ? (
            <p className="mt-2 truncate rounded-lg bg-auth-bg px-3 py-2 font-mono text-[12px] text-ink">
              {referralLink || `${appOrigin()}/signup?ref=${inviteCode}`}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyLink()}
              disabled={!referralLink || referralQuery.isLoading}
              className="inline-flex items-center gap-1.5 rounded-full border border-border-light bg-white px-3.5 py-2 text-[12.5px] font-semibold text-ink disabled:opacity-50"
            >
              <Copy className="size-3.5" aria-hidden />
              Copy link
            </button>
            <button
              type="button"
              onClick={() => void shareLink()}
              disabled={!referralLink || referralQuery.isLoading}
              className="inline-flex items-center gap-1.5 rounded-full bg-chat-accent px-3.5 py-2 text-[12.5px] font-semibold text-white disabled:opacity-50"
            >
              <Share2 className="size-3.5" aria-hidden />
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
