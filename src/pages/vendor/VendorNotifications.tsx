import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'

import { NotificationListItem } from '@/components/notifications/NotificationListItem'
import { Button } from '@/components/ui/button'
import type { GroupedNotificationDisplay } from '@/features/notifications/groupNotifications'
import {
  useNotificationMutations,
  useNotifications,
} from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'

type FilterTab = 'all' | 'unread'

export default function VendorNotifications() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<FilterTab>('all')
  const [page, setPage] = useState(1)

  const { groupedItems, unreadCount, meta, isLoading, isFetching } = useNotifications({
    page,
    perPage: 30,
    unreadOnly: tab === 'unread',
  })
  const { markBulkRead, markAllRead } = useNotificationMutations()

  const handleOpen = (item: GroupedNotificationDisplay) => {
    if (item.unreadCount > 0) {
      markBulkRead.mutate(item.notificationIds)
    }
    navigate(item.href)
  }

  const totalPages = meta?.last_page ?? 1

  return (
    <div className="p-4 md:p-6">
      <div className="container-fluid mx-auto space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="size-6 text-[#003F87]" />
              <h1 className="text-2xl font-semibold text-ink-heading">Notifications</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              One entry per sender — unread message count shown in the red badge
            </p>
          </div>
          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              {markAllRead.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCheck className="size-4" />
              )}
              Mark all as read
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-border-light bg-card p-1">
            {(['all', 'unread'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setTab(key)
                  setPage(1)
                }}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition',
                  tab === key
                    ? 'bg-[#003F87] text-white'
                    : 'text-muted-foreground hover:bg-accent',
                )}
              >
                {key}
                {key === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {isLoading || isFetching ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Loading notifications…
            </div>
          ) : groupedItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-light bg-card px-6 py-16 text-center">
              <Bell className="mx-auto size-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium text-ink-heading">No notifications</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {tab === 'unread'
                  ? "You're all caught up."
                  : 'Updates will appear here when you receive messages or account alerts.'}
              </p>
            </div>
          ) : (
            groupedItems.map((item) => (
              <NotificationListItem
                key={item.groupKey}
                item={item}
                variant="card"
                onClick={() => handleOpen(item)}
              />
            ))
          )}
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
