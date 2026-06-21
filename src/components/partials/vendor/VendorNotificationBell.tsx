import { Link, useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'

import { NotificationListItem } from '@/components/notifications/NotificationListItem'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { GroupedNotificationDisplay } from '@/features/notifications/groupNotifications'
import {
  useNotificationMutations,
  useNotifications,
  useUnreadNotificationCount,
} from '@/hooks/useNotifications'

export function VendorNotificationBell() {
  const navigate = useNavigate()
  const { data: unreadCount = 0, isLoading: countLoading } = useUnreadNotificationCount()
  const { groupedItems, isLoading, isFetching } = useNotifications({ perPage: 50 })
  const { markBulkRead, markAllRead } = useNotificationMutations()

  const badge = unreadCount > 99 ? '99+' : String(unreadCount)
  const showBadge = unreadCount > 0

  const handleOpen = (item: GroupedNotificationDisplay) => {
    if (item.unreadCount > 0) {
      markBulkRead.mutate(item.notificationIds)
    }
    navigate(item.href)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="relative h-10 w-10 rounded-xl p-0 text-foreground hover:bg-[#F1F5F9]"
          aria-label={`Notifications${showBadge ? `, ${unreadCount} unread` : ''}`}
        >
          <Bell className="size-5" />
          {showBadge ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold text-white">
              {countLoading ? '…' : badge}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[min(100vw-2rem,22rem)] p-0">
        <div className="flex items-center justify-between px-3 py-2.5">
          <DropdownMenuLabel className="p-0 text-sm font-semibold text-ink-heading">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#003F87] hover:underline disabled:opacity-50"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              {markAllRead.isPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <CheckCheck className="size-3" />
              )}
              Mark all read
            </button>
          ) : null}
        </div>

        <DropdownMenuSeparator className="m-0" />

        <div className="max-h-80 overflow-y-auto p-1">
          {isLoading || isFetching ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading…
            </div>
          ) : groupedItems.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            groupedItems.slice(0, 10).map((item) => (
              <NotificationListItem
                key={item.groupKey}
                item={item}
                variant="dropdown"
                onClick={() => handleOpen(item)}
              />
            ))
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />

        <DropdownMenuItem
          asChild
          className="justify-center rounded-none py-2.5 text-center text-sm font-semibold text-[#003F87]"
        >
          <Link to="/vendor/notifications">View all notifications</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
