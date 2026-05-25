import { cn } from '@/lib/utils'

export function NotificationCountBadge({
  count,
  className,
}: {
  count: number
  className?: string
}) {
  if (count <= 0) return null

  const label = count > 99 ? '99+' : String(count)

  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-red px-1.5 text-[10px] font-bold leading-none text-white',
        className,
      )}
      aria-label={`${count} unread`}
    >
      {label}
    </span>
  )
}
