import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type ProfileHubSectionProps = {
  title: string
  countLabel?: string
  children: ReactNode
  className?: string
}

export function ProfileHubSection({ title, countLabel, children, className }: ProfileHubSectionProps) {
  return (
    <section className={cn('px-[18px] pb-1 pt-5 lg:px-0', className)}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-[13px] font-bold uppercase tracking-[0.08em] text-body-secondary">
          {title}
        </h2>
        {countLabel ? <span className="text-[12.5px] font-semibold text-chat-meta">{countLabel}</span> : null}
      </div>
      {children}
    </section>
  )
}
