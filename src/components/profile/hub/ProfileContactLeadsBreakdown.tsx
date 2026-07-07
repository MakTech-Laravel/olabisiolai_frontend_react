import { useQuery } from '@tanstack/react-query'
import { Crown, Lock } from 'lucide-react'

import { fetchVendorAnalytics } from '@/features/analytics/vendorAnalyticsApi'
import { useVendorSubscriptionAccess } from '@/hooks/useVendorSubscriptionAccess'
import { cn } from '@/lib/utils'

import { profileHubChipClass } from './ProfileIdentitySection'

type ProfileContactLeadsBreakdownProps = {
  businessId: number
  isPremiumActive: boolean
  className?: string
}

const PREVIEW_CHANNELS = [
  { key: 'dm', label: 'Direct message', count: 0, percent: 0 },
  { key: 'whatsapp', label: 'WhatsApp', count: 0, percent: 0 },
  { key: 'phone', label: 'Phone', count: 0, percent: 0 },
] as const

export function ProfileContactLeadsBreakdown({
  businessId,
  isPremiumActive,
  className,
}: ProfileContactLeadsBreakdownProps) {
  const { analyticsLocked, goToPremiumPayment } = useVendorSubscriptionAccess()
  const locked = analyticsLocked || !isPremiumActive

  const analyticsQuery = useQuery({
    queryKey: ['vendor', 'analytics', 'contact-leads', businessId],
    queryFn: () => fetchVendorAnalytics('30d', businessId),
    enabled: !locked,
    staleTime: 60_000,
    retry: false,
  })

  const channels = locked ? PREVIEW_CHANNELS : (analyticsQuery.data?.contactLeadsByChannel ?? PREVIEW_CHANNELS)

  return (
    <div className={cn('px-[18px] pb-4', className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="font-heading text-[16px] font-bold text-ink">How leads contacted you</h4>
        {locked ? (
          <span className={profileHubChipClass('premium')}>
            <Crown className="size-2.5 fill-white text-white" aria-hidden />
            Premium
          </span>
        ) : null}
      </div>

      <div className={cn('relative', locked && 'min-h-[220px]')}>
        <div className={cn('space-y-2.5', locked && 'pointer-events-none select-none blur-[5px] opacity-55')}>
          {channels.map((channel) => (
            <div
              key={channel.key}
              className="rounded-[14px] bg-white p-3.5 shadow-[0_1px_2px_rgba(16,22,32,0.05)]"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-ink">{channel.label}</span>
                <span className="text-sm font-bold text-ink">{channel.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-auth-bg">
                <div
                  className="h-full rounded-full bg-chat-accent"
                  style={{ width: `${Math.max(channel.percent, 4)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {locked ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-3 text-center">
            <span className="mb-1 flex size-11 items-center justify-center rounded-[13px] bg-gradient-to-br from-[#FBF1DC] to-[#F6E4BC]">
              <Lock className="size-5 text-[#9A6B1F]" strokeWidth={2} aria-hidden />
            </span>
            <b className="font-heading text-base text-ink">Unlock lead analytics</b>
            <span className="max-w-[240px] text-[12.5px] leading-relaxed text-body-secondary">
              See how customers reach you through messages, WhatsApp, and phone.
            </span>
            <button
              type="button"
              onClick={() => goToPremiumPayment(businessId)}
              className="mt-2 rounded-full bg-gradient-to-br from-[#9A6B1F] to-[#C99A3F] px-[18px] py-2.5 text-[13px] font-bold text-white"
            >
              Upgrade to Premium
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
