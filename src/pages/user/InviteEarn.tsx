import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronDown,
  Copy,
  Link2,
  Loader2,
  Share2,
  Star,
  UserPlus,
} from 'lucide-react'

import { fetchUserReferrals } from '@/api/referrals'
import { useAuth } from '@/auth/useAuth'
import { formatNaira } from '@/lib/currency'
import { showError, showSuccess } from '@/lib/sweetAlert'
import { cn } from '@/lib/utils'
import { FrontendHeader } from '@/components/partials/frontend/FrontendHeader'

function copyText(value: string, successMessage: string) {
  void navigator.clipboard
    .writeText(value)
    .then(() => showSuccess(successMessage))
    .catch(() => showError('Could not copy to clipboard.'))
}

export default function InviteEarn() {
  const { user } = useAuth()
  const isMobile = window.innerWidth < 1024
  const [termsOpen, setTermsOpen] = useState(isMobile ? false : true)

  const referralsQuery = useQuery({
    queryKey: ['user', 'referrals'],
    queryFn: fetchUserReferrals,
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  })

  const referrals = referralsQuery.data
  const inviteCount = referrals?.invites.length ?? 0
  const earned = referrals?.total_earned ?? 0
  const code = referrals?.code || '—'
  const referralLink = referrals?.referral_link || ''

  const shareText = `Join Gidira and list your business for free. Use my referral code ${code}: ${referralLink}`

  async function shareInvite() {
    if (!referralLink) {
      showError('Referral link is not ready yet.')
      return
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Invite to Gidira',
          text: shareText,
          url: referralLink,
        })
        return
      } catch {
        // fall through to copy
      }
    }
    copyText(referralLink, 'Invite link copied.')
  }

  return (
    <div className="min-h-dvh text-balck">
      <FrontendHeader />
      <main className="container mx-auto px-2 lg:px-0 w-full pb-4 pt-5 lg:pb-16 lg:pt-8">
        <div className="mb-5 flex items-center justify-between lg:mb-10">
          <Link to="/user/profile" className="text-sm font-semibold text-balck/80 hover:text-balck">
            ← Back
          </Link>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-xl border border-balck/15 bg-balck/10 lg:hidden"
            onClick={() => void shareInvite()}
            aria-label="Share referral"
          >
            <Share2 className="size-5" />
          </button>
        </div>

        <div className="text-center lg:text-left">
          <h1 className="font-heading text-[34px] font-extrabold tracking-[-0.02em] lg:text-[44px]">
            Invite &amp; Earn
          </h1>
          <p className="mt-2 text-sm text-balck/70 lg:text-base">
            Bring trusted vendors to Gidira and get rewarded.
          </p>
        </div>

        {referralsQuery.isLoading ? (
          <div className="flex justify-center py-16 lg:py-24">
            <Loader2 className="size-8 animate-spin text-[#E8C677]" />
          </div>
        ) : (
          <div className="mt-6 lg:mt-10 lg:grid lg:grid-cols-[1fr_400px] lg:items-start lg:gap-8">
            <div className="space-y-4 lg:order-1 lg:space-y-6">
              <div className="flex items-center justify-between rounded-[18px] border border-balck/12 bg-balck/7 px-[18px] py-4 backdrop-blur-md lg:px-6 lg:py-5">
                <div className="flex items-center gap-3 lg:gap-4">
                  <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-balck/10 lg:size-10">
                    <UserPlus className="size-[18px] text-[#E8C677] lg:size-5" />
                  </span>
                  <div>
                    <b className="font-heading text-[17px] font-bold lg:text-xl">{inviteCount}</b>
                    <small className="block text-[11.5px] text-balck/55 lg:text-xs">vendors invited</small>
                  </div>
                </div>
                <div className="text-right">
                  <small className="block text-[11.5px] text-balck/55 lg:text-xs">Earned</small>
                  <span className="font-heading text-[21px] font-extrabold text-[#E8C677] lg:text-2xl">
                    {formatNaira(earned, { freeLabel: false })}
                  </span>
                </div>
              </div>

              <section className="rounded-[22px] border border-balck/12 bg-balck/7 p-5 backdrop-blur-md lg:p-8">
                <div className="font-heading text-[40px] font-extrabold leading-none text-[#E8C677] lg:text-[52px]">
                  ₦1,000 each
                </div>
                <p className="mt-2 text-[15px] font-semibold leading-relaxed lg:text-lg">
                  for you and the vendor when they join and get verified.
                </p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-balck/70 lg:max-w-md lg:text-sm">
                  Both rewards land in your Gidira wallets — spend on boosting, verification or Premium.
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#E8C677]/30 bg-[#E8C677]/14 px-3 py-1.5 text-xs font-bold text-[#f3b50a]">
                  <Star className="size-3.5" />
                  No limit — invite as many as you like
                </span>

                <ol className="mt-5 space-y-2 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-4 lg:space-y-0">
                  {[
                    ['Share your code or link', 'Send it to a business owner you trust'],
                    ['They join & list a business', 'Creating a page is free'],
                    ['They complete verification', 'Reviewed by the Gidira team'],
                    ['You both earn ₦1,000', '₦1,000 to your wallet, ₦1,000 to theirs'],
                  ].map(([title, subtitle], index) => (
                    <li key={title} className="flex items-start gap-3 py-1.5">
                      <span
                        className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold',
                          index === 3
                            ? 'bg-gradient-to-br from-[#9A6B1F] to-[#C99A3F] text-balck'
                            : 'bg-balck/10 text-[#f3b50a]',
                        )}
                      >
                        {index === 3 ? '✓' : index + 1}
                      </span>
                      <div>
                        <b className="block text-sm font-semibold">{title}</b>
                        <small className="text-[12.5px] text-balck/55">{subtitle}</small>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <p className="hidden text-[11.5px] leading-relaxed text-balck/55 lg:block text-center">
                Rewards are paid in <span className="font-semibold text-[#f3b50a]">Gidira wallet credit</span>, not cash.
              </p>
            </div>

            <div className="mt-4 space-y-4 lg:sticky lg:top-8 lg:order-2 lg:mt-0 lg:space-y-6">
              <div className="flex items-center gap-3 rounded-2xl border border-balck/12 bg-balck/9 px-4 py-4 lg:p-5">
                <div className="min-w-0 flex-1">
                  <b className="block font-heading text-[23px] font-extrabold tracking-[0.18em]">{code}</b>
                  <small className="text-[11.5px] tracking-[0.04em] text-balck/55">YOUR UNIQUE REFERRAL CODE</small>
                </div>
                <button
                  type="button"
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#E8C677]/16"
                  onClick={() => copyText(code, 'Referral code copied.')}
                  aria-label="Copy referral code"
                >
                  <Copy className="size-5 text-[#f3b50a]" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-[13px] border border-balck/12 bg-balck/7 px-3 py-3 text-[13.5px] font-semibold transition-colors hover:bg-balck/12"
                  onClick={() => {
                    if (!referralLink) return
                    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`
                    window.open(url, '_blank', 'noopener,noreferrer')
                  }}
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-[13px] border border-balck/12 bg-balck/7 px-3 py-3 text-[13.5px] font-semibold transition-colors hover:bg-balck/12"
                  onClick={() => referralLink && copyText(referralLink, 'Invite link copied.')}
                >
                  <Link2 className="size-4" />
                  Copy link
                </button>
              </div>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-4 text-[16.5px] font-bold shadow-[0_12px_28px_rgba(225,36,42,0.2)] transition-transform hover:scale-[1.01] text-white" 
                onClick={() => void shareInvite()}
              >
                <UserPlus className="size-5" />
                Invite a vendor
              </button>

              <div className="overflow-hidden rounded-2xl border border-balck/12 bg-balck/5">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-semibold"
                  onClick={() => setTermsOpen((open) => !open)}
                >
                  Read terms
                  <ChevronDown className={cn('size-5 transition-transform', termsOpen && 'rotate-180')} />
                </button>
                {termsOpen ? (
                  <ul className="space-y-2 border-t border-balck/10 px-4 py-4 text-[13px] leading-relaxed text-balck/70">
                    <li>You and the invited vendor each earn ₦1,000 when they sign up, list a business, and complete verification.</li>
                    <li>Rewards are credited to Gidira wallets once verification is approved.</li>
                    <li>Wallet credit can be spent on boosting, verification or Premium — not withdrawn as cash.</li>
                    <li>One reward per unique verified vendor. Self-referrals and duplicate accounts do not qualify.</li>
                  </ul>
                ) : null}
              </div>

              <p className="text-center text-[11.5px] leading-relaxed text-balck/55 lg:hidden">
                Rewards are paid in <span className="font-semibold text-[#f3b50a]">Gidira wallet credit</span>, not cash.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
