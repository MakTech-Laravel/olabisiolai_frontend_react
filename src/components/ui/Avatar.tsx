import { cn } from '@/lib/utils'

interface AvatarProps {
  src: string | null | undefined
  name: string
  className?: string
}

export function Avatar({ src, name, className }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn('rounded-lg object-cover', className)}
        loading="lazy"
        decoding="async"
      />
    )
  }
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg bg-muted text-sm font-bold text-ink',
        className,
      )}
    >
      {initial}
    </div>
  )
}
