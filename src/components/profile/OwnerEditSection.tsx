import { cn } from '@/lib/utils'
import { ownerEditSectionCard } from '@/lib/businessPageLayout'

type OwnerEditSectionProps = {
  id: string
  title?: string
  headerRight?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export function OwnerEditSection({
  id,
  title,
  headerRight,
  className,
  children,
}: OwnerEditSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        ownerEditSectionCard,
        'scroll-mt-28 mt-6',
        title || headerRight ? '' : undefined,
        className,
      )}
    >
      {title || headerRight ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title ? (
            <h2 className="font-heading text-xl font-bold text-ink lg:text-2xl">{title}</h2>
          ) : (
            <span />
          )}
          {headerRight}
        </div>
      ) : null}
      {children}
    </section>
  )
}
