import { Clock } from 'lucide-react'

type Props = {
  trialEndsAt?: string | null
  daysRemaining?: number
  className?: string
}

/** Shows a "trial ends in N days" chip. Renders nothing when there's no active trial. */
export function TrialCountdown({ trialEndsAt, daysRemaining, className }: Props) {
  if (!trialEndsAt) return null

  const days = typeof daysRemaining === 'number' ? daysRemaining : null
  const label =
    days === null
      ? 'Free trial active'
      : days <= 0
        ? 'Trial ends today'
        : `Trial ends in ${days} day${days === 1 ? '' : 's'}`

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 ${className ?? ''}`}
    >
      <Clock className="size-3" aria-hidden />
      {label}
    </span>
  )
}
