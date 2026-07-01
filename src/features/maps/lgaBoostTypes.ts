/** Per-tier boost pricing configuration (duration-based). */
export type LgaBoostTierForm = {
  key: string
  label: string
  /** Legacy field — no longer used; kept for API compatibility. */
  totalSlots?: number
  /** Legacy single price — not used when per-duration prices are set. */
  priceAmount: number
  durations: LgaBoostDurationForm[]
}

/** Boost duration option (7 / 14 / 30 days) with price. */
export type LgaBoostDurationForm = {
  days: 7 | 14 | 30
  enabled: boolean
  priceAmount: number
}

/** Admin UI + API payload for LGA boost settings at create/update time. */
export type LgaBoostFormState = {
  enabled: boolean
  tiers: LgaBoostTierForm[]
  /** Aggregated for API backward compatibility — derived from tier durations on save. */
  durations: LgaBoostDurationForm[]
}

export const LGA_BOOST_TIER_ORDER = ['top_10', 'top_5', 'top_1'] as const

const TIER_DEFAULTS: Record<
  (typeof LGA_BOOST_TIER_ORDER)[number],
  { label: string; prices: [number, number, number] }
> = {
  top_10: { label: 'Top 10 Boost', prices: [3000, 5000, 10000] },
  top_5: { label: 'Top 5 Boost', prices: [5000, 10000, 15000] },
  top_1: { label: 'Top 1 Exclusive', prices: [10000, 15000, 20000] },
}

const DURATION_DAYS: (7 | 14 | 30)[] = [7, 14, 30]

export function buildTierDurations(
  prices: [number, number, number],
  globalDurations?: { days: number; enabled: boolean; priceAmount: number }[],
): LgaBoostDurationForm[] {
  return DURATION_DAYS.map((days, index) => {
    const global = globalDurations?.find((d) => d.days === days)
    return {
      days,
      enabled: global?.enabled ?? true,
      priceAmount:
        global && global.priceAmount > 0 ? global.priceAmount : prices[index],
    }
  })
}

export function parseTierDurationsFromRaw(
  raw: unknown,
  tierKey: string,
  globalDurations?: { days: number; enabled: boolean; priceAmount: number }[],
): LgaBoostDurationForm[] {
  if (!Array.isArray(raw)) {
    const def = TIER_DEFAULTS[tierKey as keyof typeof TIER_DEFAULTS]
    return def
      ? buildTierDurations(def.prices, globalDurations)
      : buildTierDurations([0, 0, 0], globalDurations)
  }
  const out: LgaBoostDurationForm[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const days = Number(o.days ?? o.duration_days ?? 0)
    if (days !== 7 && days !== 14 && days !== 30) continue
    out.push({
      days: days as 7 | 14 | 30,
      enabled: Boolean(o.enabled ?? o.is_active ?? true),
      priceAmount: Number(o.price_amount ?? o.priceAmount ?? o.price ?? 0) || 0,
    })
  }
  if (out.length === 3) return out
  const def = TIER_DEFAULTS[tierKey as keyof typeof TIER_DEFAULTS]
  return def
    ? buildTierDurations(def.prices, globalDurations)
    : buildTierDurations([0, 0, 0], globalDurations)
}

/** Normalize to fixed tiers (top_10 / top_5 / top_1) with duration pricing. */
export function normalizeBoostTiers(
  tiers: LgaBoostTierForm[],
  globalDurations?: { days: number; enabled: boolean; priceAmount: number }[],
): LgaBoostTierForm[] {
  const incomingKeys = new Set(tiers.map((tier) => tier.key))
  const byKey = new Map<string, LgaBoostTierForm>()
  for (const tier of tiers) {
    let key = tier.key
    if (key === 'top_3') {
      key = 'top_5'
    } else if (key === 'top_5' && !incomingKeys.has('top_10')) {
      key = 'top_10'
    }
    byKey.set(key, { ...tier, key })
  }

  return LGA_BOOST_TIER_ORDER.map((key) => {
    const def = TIER_DEFAULTS[key]
    const existing = byKey.get(key)
    const durations =
      existing?.durations?.length === 3
        ? existing.durations
        : parseTierDurationsFromRaw(
          (existing as { durations?: unknown })?.durations,
          key,
          globalDurations,
        )

    return {
      key,
      label: existing?.label?.trim() || def.label,
      totalSlots: 0,
      priceAmount: existing?.priceAmount ?? 0,
      durations,
    }
  })
}

export function aggregateDurationsFromTiers(
  tiers: LgaBoostTierForm[],
): LgaBoostDurationForm[] {
  return DURATION_DAYS.map((days) => ({
    days,
    enabled: tiers.some((t) => t.durations.find((d) => d.days === days)?.enabled),
    priceAmount: 0,
  }))
}

export function defaultLgaBoostFormState(): LgaBoostFormState {
  const tiers = normalizeBoostTiers([])
  return {
    enabled: true,
    tiers,
    durations: aggregateDurationsFromTiers(tiers),
  }
}

export function boostFormFromSaved(boost: {
  enabled: boolean
  tiers: LgaBoostTierForm[]
  durations: { days: number; enabled: boolean; priceAmount: number }[]
}): LgaBoostFormState {
  const tiers = normalizeBoostTiers(boost.tiers, boost.durations)
  return {
    enabled: boost.enabled,
    tiers,
    durations: aggregateDurationsFromTiers(tiers),
  }
}

export type LgaBoostStats = {
  activeBoosts: number
  expiredBoosts: number
}
