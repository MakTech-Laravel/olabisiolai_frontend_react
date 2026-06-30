import { Input } from '@/components/ui/input'
import {
  clampBoostBudget,
  computeBoostTotal,
  DYNAMIC_BOOST_BUDGET_MAX,
  DYNAMIC_BOOST_BUDGET_MIN,
  DYNAMIC_BOOST_BUDGET_STEP,
  DYNAMIC_BOOST_DURATIONS,
  durationFromSliderIndex,
  durationSliderIndex,
  formatBoostBudget,
  nearestBoostDuration,
  type DynamicBoostDuration,
} from '@/features/boost/dynamicBoostConfig'
import { cn } from '@/lib/utils'

type DynamicBoostBudgetFieldsProps = {
  dailyBudget: number
  durationDays: DynamicBoostDuration
  onDailyBudgetChange: (amount: number) => void
  onDurationChange: (days: DynamicBoostDuration) => void
  durations?: readonly number[]
  budgetMin?: number
  budgetMax?: number
  compact?: boolean
  className?: string
}

export function DynamicBoostBudgetFields({
  dailyBudget,
  durationDays,
  onDailyBudgetChange,
  onDurationChange,
  durations = DYNAMIC_BOOST_DURATIONS,
  budgetMin = DYNAMIC_BOOST_BUDGET_MIN,
  budgetMax = DYNAMIC_BOOST_BUDGET_MAX,
  compact = false,
  className,
}: DynamicBoostBudgetFieldsProps) {
  const clampedDaily = clampBoostBudget(dailyBudget)
  const totalCost = computeBoostTotal(clampedDaily, durationDays)
  const durationIndex = durationSliderIndex(durationDays, durations)

  return (
    <div className={cn('space-y-5', className)}>
      <div className={cn(!compact && 'rounded-2xl border border-border-light bg-card p-5 shadow-sm sm:p-6')}>
        {!compact ? (
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-ink">What&apos;s your boost budget?</h3>
            <p className="mt-1 text-sm text-body-secondary">
              Set a daily budget and duration. Higher daily budget increases visibility while boosted.
            </p>
          </div>
        ) : null}

        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-ink" htmlFor="boost-daily-budget">
              Daily budget
            </label>
            <div className="flex items-center gap-1 rounded-lg border border-border-light bg-surface-soft px-3 py-1.5">
              <span className="text-sm text-body-secondary">₦</span>
              <Input
                id="boost-daily-budget"
                type="number"
                min={budgetMin}
                max={budgetMax}
                step={DYNAMIC_BOOST_BUDGET_STEP}
                value={clampedDaily}
                onChange={(event) => onDailyBudgetChange(Number(event.target.value))}
                onBlur={() => onDailyBudgetChange(clampedDaily)}
                className="h-7 w-20 border-0 bg-transparent p-0 text-right text-sm font-semibold shadow-none focus-visible:ring-0"
                aria-label="Daily budget in naira"
              />
            </div>
          </div>
          <Input
            type="range"
            min={budgetMin}
            max={budgetMax}
            step={DYNAMIC_BOOST_BUDGET_STEP}
            value={clampedDaily}
            onChange={(event) => onDailyBudgetChange(Number(event.target.value))}
            className="mt-2"
            aria-label="Daily budget slider"
          />
          <p className="text-xs text-body-secondary">
            {formatBoostBudget(budgetMin)} – {formatBoostBudget(budgetMax)} per day
          </p>
        </div>

        <div className="mt-6 space-y-1">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-ink" htmlFor="boost-duration">
              Duration
            </label>
            <div className="flex items-center gap-1 rounded-lg border border-border-light bg-surface-soft px-3 py-1.5">
              <Input
                id="boost-duration"
                type="number"
                min={durations[0]}
                max={durations[durations.length - 1]}
                value={durationDays}
                onChange={(event) => {
                  const parsed = Number(event.target.value)
                  if (Number.isFinite(parsed)) {
                    onDurationChange(nearestBoostDuration(parsed, durations))
                  }
                }}
                className="h-7 w-12 border-0 bg-transparent p-0 text-right text-sm font-semibold shadow-none focus-visible:ring-0"
                aria-label="Boost duration in days"
              />
              <span className="text-sm text-body-secondary">{durationDays === 1 ? 'day' : 'days'}</span>
            </div>
          </div>
          <Input
            type="range"
            min={0}
            max={Math.max(0, durations.length - 1)}
            step={1}
            value={durationIndex}
            onChange={(event) =>
              onDurationChange(durationFromSliderIndex(Number(event.target.value), durations))
            }
            className="mt-2"
            aria-label="Duration slider"
          />
          <div className="flex flex-wrap gap-2 pt-1">
            {durations.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => onDurationChange(days as DynamicBoostDuration)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  durationDays === days
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-border-light text-body-secondary hover:border-brand/40',
                )}
              >
                {days} {days === 1 ? 'day' : 'days'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-body-secondary">Daily budget</span>
            <span className="font-semibold text-ink">{formatBoostBudget(clampedDaily)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-body-secondary">Total cost</span>
            <span className="text-lg font-bold text-brand">{formatBoostBudget(totalCost)}</span>
          </div>
          <p className="mt-2 text-xs text-body-secondary">
            {formatBoostBudget(clampedDaily)}/day × {durationDays}{' '}
            {durationDays === 1 ? 'day' : 'days'}
          </p>
        </div>
      </div>
    </div>
  )
}
