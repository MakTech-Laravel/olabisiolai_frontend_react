import { formatNotificationTime, toneDotClass } from '@/features/notifications/notificationDisplay'
import type { GroupedNotificationDisplay } from '@/features/notifications/groupNotifications'
import { NotificationCountBadge } from '@/components/notifications/NotificationCountBadge'
import { cn } from '@/lib/utils'

type Variant = 'dropdown' | 'card'

export function NotificationListItem({
  item,
  variant,
  onClick,
}: {
  item: GroupedNotificationDisplay
  variant: Variant
  onClick: () => void
}) {
  const showBadge = item.unreadCount > 0
  const subtitle =
    item.isGrouped && item.type === 'new_message' && item.messageCount > 1 && !showBadge
      ? `${item.messageCount} messages`
      : item.message

  if (variant === 'dropdown') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex w-full cursor-pointer flex-col items-start gap-1 rounded-lg px-3 py-2.5 text-left transition hover:bg-accent',
          !item.isRead && 'bg-[#F1F5F9]',
        )}
      >
        <div className="flex w-full items-start gap-2">
          <span
            className={cn('mt-1.5 size-2 shrink-0 rounded-full', toneDotClass(item.tone))}
            aria-hidden
          />
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-semibold text-ink-heading">{item.title}</span>
                {showBadge ? <NotificationCountBadge count={item.unreadCount} /> : null}
              </span>
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {formatNotificationTime(item.createdAt)}
              </span>
            </span>
            {subtitle ? (
              <span className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{subtitle}</span>
            ) : null}
          </span>
        </div>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border border-border-light bg-card p-4 text-left transition hover:border-[#003F87]/30 hover:shadow-sm',
        !item.isRead && 'border-l-4 border-l-[#003F87] bg-[#F8FAFC]',
      )}
    >
      <span
        className={cn('mt-1.5 size-2.5 shrink-0 rounded-full', toneDotClass(item.tone))}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink-heading">{item.title}</span>
            {showBadge ? <NotificationCountBadge count={item.unreadCount} /> : null}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatNotificationTime(item.createdAt)}
          </span>
        </span>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </span>
    </button>
  )
}
