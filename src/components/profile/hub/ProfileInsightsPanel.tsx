import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Crown,
  Eye,
  Lock,
  MessageSquare,
  UserPlus,
} from 'lucide-react'

import { fetchNotifications } from '@/api/notifications'
import {
  fetchVendorAnalytics,
  type VendorAnalyticsRange,
} from '@/features/analytics/vendorAnalyticsApi'
import { formatDashboardCount, fetchVendorDashboard } from '@/features/dashboard/vendorDashboardApi'
import { useVendorSubscriptionAccess } from '@/hooks/useVendorSubscriptionAccess'
import { cn } from '@/lib/utils'

import { profileHubChipClass } from './ProfileIdentitySection'

export type ProfileInsightsRange = '7d' | '30d' | '90d'

const ranges: { key: ProfileInsightsRange; label: string }[] = [
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
]

function mapInsightsRange(range: ProfileInsightsRange): VendorAnalyticsRange {
  if (range === '90d') return 'quarter'
  return '30d'
}

const previewMetrics = [
  { key: 'views', label: 'Views', icon: Eye, tone: 'bg-[#EAF2FD] text-chat-accent' },
  { key: 'leads', label: 'Leads', icon: UserPlus, tone: 'bg-[#E7F6EF] text-[#13a36b]' },
  { key: 'follows', label: 'Followers', icon: UserPlus, tone: 'bg-[#FDEEEE] text-brand' },
  { key: 'msgs', label: 'Messages', icon: MessageSquare, tone: 'bg-[#F1ECFB] text-[#6b4f9f]' },
] as const

type ProfileInsightsPanelProps = {
  businessId: number
  followersCount?: number
  isPremiumActive: boolean
}

export function ProfileInsightsPanel({ businessId, followersCount = 0, isPremiumActive }: ProfileInsightsPanelProps) {
  const [range, setRange] = useState<ProfileInsightsRange>('30d')
  const { analyticsLocked, goToPremiumPayment } = useVendorSubscriptionAccess()
  const locked = analyticsLocked || !isPremiumActive

  const dashboardQuery = useQuery({
    queryKey: ['vendor', 'dashboard', 'profile-hub', businessId],
    queryFn: fetchVendorDashboard,
    enabled: !locked,
    staleTime: 60_000,
  })

  const analyticsQuery = useQuery({
    queryKey: ['vendor', 'analytics', 'profile-hub', businessId, range],
    queryFn: () => fetchVendorAnalytics(mapInsightsRange(range), businessId),
    enabled: !locked,
    staleTime: 60_000,
  })

  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'unread', 'profile-hub'],
    queryFn: () => fetchNotifications({ page: 1, perPage: 1 }),
    enabled: !locked,
    staleTime: 30_000,
  })

  const isLoading = !locked && (dashboardQuery.isLoading || analyticsQuery.isLoading)

  const values: Record<string, string> = {
    views:
      analyticsQuery.data?.stats.find((s) => /view/i.test(s.title))?.value ??
      formatDashboardCount(dashboardQuery.data?.stats.profileViews ?? 0),
    leads:
      analyticsQuery.data?.stats.find((s) => /lead|enquir/i.test(s.title))?.value ??
      formatDashboardCount(dashboardQuery.data?.stats.enquiries ?? 0),
    follows: formatDashboardCount(followersCount),
    msgs: isLoading
      ? '—'
      : formatDashboardCount(analyticsQuery.data?.messagesCount ?? notificationsQuery.data?.unread_count ?? 0),
  }

  return (
    <div className="px-[18px] pb-1 pt-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="font-heading text-[17px] font-bold text-ink">Insights</h4>
        {locked ? (
          <span className={profileHubChipClass('premium')}>
            <Crown className="size-2.5 fill-white text-white" aria-hidden />
            Premium
          </span>
        ) : (
          <div className="flex rounded-[10px] bg-auth-bg p-0.5">
            {ranges.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setRange(item.key)}
                aria-pressed={range === item.key}
                className={cn(
                  'rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors',
                  range === item.key ? 'bg-white text-ink shadow-sm' : 'text-body-secondary',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={cn('relative', locked && 'min-h-[220px]')}>
        <div className={cn('grid grid-cols-2 gap-2.5', locked && 'pointer-events-none select-none blur-[5px] opacity-55')}>
          {previewMetrics.map((metric) => {
            const Icon = metric.icon
            return (
              <div
                key={metric.key}
                className="rounded-[14px] bg-white p-3.5 shadow-[0_1px_2px_rgba(16,22,32,0.05)]"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className={cn('flex size-[30px] items-center justify-center rounded-[9px]', metric.tone)}>
                    <Icon className="size-4" strokeWidth={2} aria-hidden />
                  </span>
                  {!locked ? <span className="text-[11.5px] font-bold text-[#13a36b]">↑8%</span> : null}
                </div>
                <b className="font-heading text-[23px] font-bold leading-none text-ink">
                  {locked ? (metric.key === 'views' ? '1.2k' : metric.key === 'leads' ? '48' : metric.key === 'follows' ? '126' : '19') : isLoading ? '—' : values[metric.key]}
                </b>
                <span className="mt-1 block text-xs text-chat-meta">{metric.label}</span>
              </div>
            )
          })}
        </div>

        {locked ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-3 text-center">
            <span className="mb-1 flex size-11 items-center justify-center rounded-[13px] bg-gradient-to-br from-[#FBF1DC] to-[#F6E4BC]">
              <Lock className="size-5 text-[#9A6B1F]" strokeWidth={2} aria-hidden />
            </span>
            <b className="font-heading text-base text-ink">Unlock insights</b>
            <span className="max-w-[240px] text-[12.5px] leading-relaxed text-body-secondary">
              Track views, leads, followers and messages over 7, 30 or 90 days.
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

      {!locked ? (
        <p className="mt-3 text-[11.5px] leading-relaxed text-chat-meta">
          Leads are customers who called, messaged or chatted on WhatsApp in the last {range}.
        </p>
      ) : null}
    </div>
  )
}
