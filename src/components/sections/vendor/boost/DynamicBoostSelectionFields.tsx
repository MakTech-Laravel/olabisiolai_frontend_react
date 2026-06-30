import { Rocket } from 'lucide-react'

import { DynamicBoostBudgetFields } from '@/components/sections/vendor/boost/DynamicBoostBudgetFields'
import {
  clampBoostBudget,
  computeBoostTotal,
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
  const clampedDaily = clampBoostBudget(budgetAmount)
  const totalCost = computeBoostTotal(clampedDaily, durationDays)
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
            Increase visibility in your target LGA. Set daily budget and duration.
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
          <DynamicBoostBudgetFields
            compact
            dailyBudget={budgetAmount}
            durationDays={durationDays}
            onDailyBudgetChange={onBudgetChange}
            onDurationChange={onDurationChange}
          />

          <div className="rounded-md border border-sky-200 bg-white px-3 py-2">
            <p className="text-[11px] uppercase text-muted-foreground">Boost add-on total</p>
            <p className="text-base font-semibold text-foreground">{formatBoostBudget(totalCost)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Daily budget: {formatBoostBudget(clampedDaily)} · {durationDays}{' '}
              {durationDays === 1 ? 'day' : 'days'}
            </p>
          </div>
        </>
      ) : null}
    </div>
  )
}
