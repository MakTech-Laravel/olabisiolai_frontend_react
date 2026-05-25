import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function UnreadCountBadge({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex min-w-5 items-center justify-center rounded-full bg-chat-accent px-1.5 py-0.5 text-[10px] font-bold text-text-white',
        className,
      )}
    >
      {children}
    </span>
  )
}
