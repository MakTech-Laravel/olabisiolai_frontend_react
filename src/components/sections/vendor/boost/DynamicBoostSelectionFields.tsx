import { Rocket } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  clampBoostBudget,
  DYNAMIC_BOOST_BUDGET_MAX,
  DYNAMIC_BOOST_BUDGET_MIN,
  DYNAMIC_BOOST_BUDGET_STEP,
  DYNAMIC_BOOST_DURATIONS,
  formatBoostBudget,
  type DynamicBoostDuration,
} from '@/features/boost/dynamicBoostConfig'
import { cn } from '@/lib/utils'

type DynamicBoostSelectionFieldsProps = {
  durationDays: DynamicBoostDuration
  budgetAmount: number
  onDurationChange: (days: DynamicBoostDuration) => void
  onBudgetChange: (amount: number) => void
  includeBoost?: boolean
  onIncludeBoostChange?: (included: boolean) => void
  className?: string
}

export function DynamicBoostSelectionFields({
  durationDays,
  budgetAmount,
  onDurationChange,
  onBudgetChange,
  includeBoost,
  onIncludeBoostChange,
  className,
}: DynamicBoostSelectionFieldsProps) {
  const clampedBudget = clampBoostBudget(budgetAmount)
  const showFields = onIncludeBoostChange ? includeBoost === true : true

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <Rocket className="size-4" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">Dynamic Boost (optional)</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Increase visibility in your target LGA. Choose duration and budget — no slot limits.
          </p>
        </div>
      </div>

      {onIncludeBoostChange ? (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            className="size-4 rounded border-slate-300 text-brand focus:ring-brand/30"
            checked={includeBoost === true}
            onChange={(event) => onIncludeBoostChange(event.target.checked)}
          />
          Add boost to my premium checkout
        </label>
      ) : null}

      {showFields ? (
        <>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Duration</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DYNAMIC_BOOST_DURATIONS.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => onDurationChange(days)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    durationDays === days
                      ? 'border-brand bg-brand text-white'
                      : 'border-border-light bg-white text-ink hover:border-brand/40',
                  )}
                >
                  {days} {days === 1 ? 'day' : 'days'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Budget</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatBoostBudget(DYNAMIC_BOOST_BUDGET_MIN)} – {formatBoostBudget(DYNAMIC_BOOST_BUDGET_MAX)}
                </p>
              </div>
              <p className="text-base font-semibold text-brand">{formatBoostBudget(clampedBudget)}</p>
            </div>

            <Input
              type="range"
              min={DYNAMIC_BOOST_BUDGET_MIN}
              max={DYNAMIC_BOOST_BUDGET_MAX}
              step={DYNAMIC_BOOST_BUDGET_STEP}
              value={budgetAmount}
              onChange={(event) => onBudgetChange(Number(event.target.value))}
              className="mt-3"
              aria-label="Boost budget"
            />

            <div className="mt-2 grid grid-cols-3 gap-2">
              {[500, 1500, 5000].map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(clampedBudget === preset && 'border-brand text-brand')}
                  onClick={() => onBudgetChange(preset)}
                >
                  {formatBoostBudget(preset)}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-sky-200 bg-white px-3 py-2">
            <p className="text-[11px] uppercase text-muted-foreground">Boost add-on total</p>
            <p className="text-base font-semibold text-foreground">{formatBoostBudget(clampedBudget)}</p>
          </div>
        </>
      ) : null}
    </div>
  )
}
