export const DYNAMIC_BOOST_TIER_KEY = 'dynamic'

export const DYNAMIC_BOOST_DURATIONS = [1, 3, 7] as const

export type DynamicBoostDuration = (typeof DYNAMIC_BOOST_DURATIONS)[number]

export const DYNAMIC_BOOST_BUDGET_MIN = 500

export const DYNAMIC_BOOST_BUDGET_MAX = 5000

export const DYNAMIC_BOOST_BUDGET_STEP = 100

export function formatBoostBudget(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function clampBoostBudget(value: number): number {
  const stepped = Math.round(value / DYNAMIC_BOOST_BUDGET_STEP) * DYNAMIC_BOOST_BUDGET_STEP
  return Math.min(DYNAMIC_BOOST_BUDGET_MAX, Math.max(DYNAMIC_BOOST_BUDGET_MIN, stepped))
}
