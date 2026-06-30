export const DYNAMIC_BOOST_TIER_KEY = 'dynamic'

export const DYNAMIC_BOOST_DURATIONS = [1, 3, 7, 14, 30] as const

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

export function computeBoostTotal(dailyBudget: number, durationDays: number): number {
  return clampBoostBudget(dailyBudget) * durationDays
}

export function normalizeBoostDurations(durations: number[] | undefined): DynamicBoostDuration[] {
  const allowed = new Set<number>(DYNAMIC_BOOST_DURATIONS)
  const normalized = (durations ?? [...DYNAMIC_BOOST_DURATIONS]).filter((days) => allowed.has(days))
  return (normalized.length > 0 ? normalized : [...DYNAMIC_BOOST_DURATIONS]) as DynamicBoostDuration[]
}

export function nearestBoostDuration(
  days: number,
  durations: readonly number[] = DYNAMIC_BOOST_DURATIONS,
): DynamicBoostDuration {
  const sorted = [...durations].sort((a, b) => a - b)
  let closest = sorted[0] ?? DYNAMIC_BOOST_DURATIONS[0]
  let smallestDiff = Math.abs(days - closest)

  for (const candidate of sorted) {
    const diff = Math.abs(days - candidate)
    if (diff < smallestDiff) {
      smallestDiff = diff
      closest = candidate
    }
  }

  return closest as DynamicBoostDuration
}

export function durationSliderIndex(
  days: number,
  durations: readonly number[] = DYNAMIC_BOOST_DURATIONS,
): number {
  const index = durations.indexOf(days)
  return index >= 0 ? index : 0
}

export function durationFromSliderIndex(
  index: number,
  durations: readonly number[] = DYNAMIC_BOOST_DURATIONS,
): DynamicBoostDuration {
  const clamped = Math.min(Math.max(0, index), durations.length - 1)
  return (durations[clamped] ?? DYNAMIC_BOOST_DURATIONS[0]) as DynamicBoostDuration
}
