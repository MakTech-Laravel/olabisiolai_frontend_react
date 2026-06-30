import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

export function BusinessPageBlockSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn('bg-[#dfe5ee]', className)} />
}

export function BusinessHeroSkeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden>
      <BusinessPageBlockSkeleton
        className={cn(
          'h-[208px] w-full rounded-[22px] sm:h-[400px] lg:h-[400px] lg:rounded-2xl xl:h-[540px]',
          className,
        )}
      />
    </div>
  )
}

export function BusinessIdentityCardSkeleton() {
  return (
    <div
      className="rounded-[22px] bg-[#EAF2FD] px-[18px] py-5 lg:rounded-2xl lg:px-6 lg:py-6"
      aria-hidden
    >
      <BusinessPageBlockSkeleton className="mb-3 size-16 rounded-[18px] lg:size-20 lg:rounded-2xl" />
      <BusinessIdentitySkeleton />
    </div>
  )
}

export function BusinessIdentitySkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <BusinessPageBlockSkeleton className="h-7 w-[min(280px,72%)] rounded-lg" />
      <BusinessPageBlockSkeleton className="h-4 w-[min(220px,55%)] rounded-md" />
      <BusinessPageBlockSkeleton className="h-4 w-32 rounded-md" />
      <div className="flex items-center gap-2 pt-1">
        <BusinessPageBlockSkeleton className="size-[18px] rounded-sm" />
        <BusinessPageBlockSkeleton className="h-4 w-24 rounded-md" />
        <BusinessPageBlockSkeleton className="h-4 w-20 rounded-md" />
      </div>
    </div>
  )
}

export function BusinessOverviewSkeleton() {
  return (
    <div className="space-y-2.5" aria-hidden>
      <BusinessPageBlockSkeleton className="h-4 w-full rounded-md" />
      <BusinessPageBlockSkeleton className="h-4 w-[92%] rounded-md" />
      <BusinessPageBlockSkeleton className="h-4 w-[78%] rounded-md" />
    </div>
  )
}

export function BusinessActionsSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 md:gap-3" aria-hidden>
      <BusinessPageBlockSkeleton className="h-[52px] w-full rounded-[14px]" />
      <BusinessPageBlockSkeleton className="h-[52px] w-full rounded-[14px]" />
      <div className="flex items-center justify-center gap-6 pt-1">
        <BusinessPageBlockSkeleton className="h-4 w-16 rounded-md" />
        <BusinessPageBlockSkeleton className="h-4 w-16 rounded-md" />
      </div>
    </div>
  )
}

export function BusinessTrustSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white px-4 shadow-sm lg:px-5" aria-hidden>
      <div className="flex items-center gap-3 border-b border-border-light py-3.5">
        <BusinessPageBlockSkeleton className="size-5 shrink-0 rounded-full" />
        <BusinessPageBlockSkeleton className="h-4 w-48 rounded-md" />
      </div>
      <div className="flex items-center gap-3 py-3.5">
        <BusinessPageBlockSkeleton className="size-5 shrink-0 rounded-full" />
        <BusinessPageBlockSkeleton className="h-4 w-56 rounded-md" />
      </div>
    </div>
  )
}

export function BusinessHoursSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl bg-[#EAF2FD] px-[18px] py-4 lg:py-5',
        className,
      )}
      aria-hidden
    >
      <div className="space-y-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <BusinessPageBlockSkeleton className="h-3.5 w-24 rounded-md" />
            <BusinessPageBlockSkeleton className="h-3.5 w-28 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function BusinessCatalogSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="space-y-2">
        <BusinessPageBlockSkeleton className="h-7 w-40 rounded-lg" />
        <BusinessPageBlockSkeleton className="h-4 w-64 max-w-full rounded-md" />
      </div>
      <div className="flex gap-2">
        <BusinessPageBlockSkeleton className="h-9 w-16 rounded-full" />
        <BusinessPageBlockSkeleton className="h-9 w-20 rounded-full" />
        <BusinessPageBlockSkeleton className="h-9 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <BusinessPageBlockSkeleton className="h-[100px] w-full rounded-none" />
            <div className="space-y-2 p-3">
              <BusinessPageBlockSkeleton className="h-4 w-3/4 rounded-md" />
              <BusinessPageBlockSkeleton className="h-3 w-full rounded-md" />
              <BusinessPageBlockSkeleton className="h-4 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
