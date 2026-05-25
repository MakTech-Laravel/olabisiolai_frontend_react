import type { UserStatus } from '@/types/user'
import { cn } from '@/lib/utils'

interface OnlineStatusProps {
  status: UserStatus
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'size-2', md: 'size-2.5', lg: 'size-3' }

export function OnlineStatus({ status, size = 'sm' }: OnlineStatusProps) {
  const color =
    status === 'online'
      ? 'bg-chat-online-dot'
      : status === 'away'
        ? 'bg-amber-400'
        : 'bg-muted-foreground/50'
  return (
    <span
      className={cn(
        'absolute bottom-0 right-0 rounded-full border-2 border-chat-surface',
        sizes[size],
        color,
      )}
      aria-hidden
    />
  )
}
