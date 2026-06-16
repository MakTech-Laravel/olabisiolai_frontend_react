import { useQuery } from '@tanstack/react-query'

import { fetchVendorAnalytics } from '@/features/analytics/vendorAnalyticsApi'
import { cn } from '@/lib/utils'

type ProfileContactLeadsBreakdownProps = {
  businessId: number
  className?: string
}

export function ProfileContactLeadsBreakdown({ businessId, className }: ProfileContactLeadsBreakdownProps) {
  const analyticsQuery = useQuery({
    queryKey: ['vendor', 'analytics', 'contact-leads', businessId],
    queryFn: () => fetchVendorAnalytics('30d', businessId),
    staleTime: 60_000,
  })

  const channels = analyticsQuery.data?.contactLeadsByChannel ?? []

  if (channels.length === 0) {
    return null
  }

  return (
    <div className={cn('px-[18px] pb-4', className)}>
      <h4 className="mb-3 font-heading text-[16px] font-bold text-ink">How leads contacted you</h4>
      <div className="space-y-2.5">
        {channels.map((channel) => (
          <div key={channel.key} className="rounded-[14px] bg-white p-3.5 shadow-[0_1px_2px_rgba(16,22,32,0.05)]">
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
    </div>
  )
}
