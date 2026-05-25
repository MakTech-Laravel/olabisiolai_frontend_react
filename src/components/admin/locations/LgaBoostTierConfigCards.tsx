import {
  type LgaBoostDurationForm,
  type LgaBoostTierForm,
} from '@/features/maps/lgaBoostTypes'

const TIER_THEMES: Record<
  string,
  { card: string; accent: string; priceRow: string; medal: string }
> = {
  top_10: {
    card: 'border-[#f0d6bd] bg-gradient-to-b from-[#fff9f2] to-[#fff3e8]',
    accent: 'text-[#c77b38]',
    priceRow: 'border-[#f0d6bd]/80 bg-white/90',
    medal: '3',
  },
  top_5: {
    card: 'border-[#d9dee8] bg-gradient-to-b from-[#f8fafc] to-[#f1f4f9]',
    accent: 'text-[#5f6b7a]',
    priceRow: 'border-[#d9dee8] bg-white/90',
    medal: '2',
  },
  top_3: {
    card: 'border-[#d9dee8] bg-gradient-to-b from-[#f8fafc] to-[#f1f4f9]',
    accent: 'text-[#5f6b7a]',
    priceRow: 'border-[#d9dee8] bg-white/90',
    medal: '2',
  },
  top_1: {
    card: 'border-[#f2dd8b] bg-gradient-to-b from-[#fffdf2] to-[#fff8dc]',
    accent: 'text-[#b47d00]',
    priceRow: 'border-[#f2dd8b]/90 bg-white/90',
    medal: '1',
  },
}

type Props = {
  tiers: LgaBoostTierForm[]
  onChange: (tiers: LgaBoostTierForm[]) => void
  disabled?: boolean
}

export function LgaBoostTierConfigCards({ tiers, onChange, disabled }: Props) {
  const patchTier = (key: string, patch: Partial<LgaBoostTierForm>) => {
    onChange(tiers.map((t) => (t.key === key ? { ...t, ...patch } : t)))
  }

  const patchDuration = (
    tierKey: string,
    days: LgaBoostDurationForm['days'],
    patch: Partial<LgaBoostDurationForm>,
  ) => {
    onChange(
      tiers.map((t) =>
        t.key !== tierKey
          ? t
          : {
            ...t,
            durations: t.durations.map((d) =>
              d.days === days ? { ...d, ...patch } : d,
            ),
          },
      ),
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {tiers.map((tier) => {
        const theme = TIER_THEMES[tier.key] ?? TIER_THEMES.top_10
        return (
          <article
            key={tier.key}
            className={`flex flex-col rounded-2xl border p-4 shadow-sm ${theme.card} ${disabled ? 'opacity-60' : ''}`}
          >
            <div className="mb-3 flex items-start gap-3">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold shadow-sm ring-2 ring-black/5"
                aria-hidden
              >
                {theme.medal}
              </div>
              <div className="min-w-0 flex-1">
                <input
                  type="text"
                  disabled={disabled}
                  className="w-full rounded border border-transparent bg-transparent px-0 py-0 text-sm font-bold text-gray-900 focus:border-gray-200 focus:bg-white focus:px-2 focus:py-1"
                  value={tier.label}
                  onChange={(e) => patchTier(tier.key, { label: e.target.value })}
                />
                <p className={`mt-0.5 text-[11px] font-medium ${theme.accent}`}>
                  {tier.totalSlots} slot{tier.totalSlots === 1 ? '' : 's'} · {tier.key}
                </p>
              </div>
            </div>

            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Duration pricing
            </p>
            <div className="space-y-2">
              {tier.durations.map((d) => (
                <div
                  key={d.days}
                  className={`flex flex-wrap items-center gap-2 rounded-lg border px-2.5 py-2 text-xs ${theme.priceRow}`}
                >
                  <label className="flex min-w-[88px] items-center gap-2">
                    <input
                      type="checkbox"
                      className="size-3.5 rounded border-gray-300"
                      checked={d.enabled}
                      disabled={disabled}
                      onChange={(e) =>
                        patchDuration(tier.key, d.days, { enabled: e.target.checked })
                      }
                    />
                    <span className="font-medium text-gray-800">{d.days} Days</span>
                  </label>
                  <div className="flex min-w-[120px] flex-1 items-center gap-1.5">
                    <span className="text-gray-500">₦</span>
                    <input
                      type="number"
                      min={0}
                      disabled={disabled || !d.enabled}
                      className="w-full rounded border border-gray-200 px-2 py-1 text-sm disabled:bg-gray-50"
                      value={d.priceAmount || ''}
                      onChange={(e) =>
                        patchDuration(tier.key, d.days, {
                          priceAmount: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
        )
      })}
    </div>
  )
}