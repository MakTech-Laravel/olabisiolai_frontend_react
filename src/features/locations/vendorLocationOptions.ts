export type BoostTierView = {
  key: string;
  label: string;
  totalSlots: number;
  priceAmount: number;
  slotsOccupied?: number;
  slotsRemaining?: number;
  isAvailable?: boolean;
  durations?: BoostDurationView[];
};

export type BoostDurationView = {
  days: number;
  enabled: boolean;
  priceAmount: number;
};

export type ParsedLocationOption = {
  id: string;
  location: string;
  state: string;
  city: string;
  lga: string;
  label: string;
  boost: {
    enabled: boolean;
    tiers: BoostTierView[];
    durations: BoostDurationView[];
    stats: {
      totalSlots: number;
      slotsSold: number;
      slotsRemaining: number;
      activeBoosts?: number;
      expiredBoosts?: number;
    };
  } | null;
};

function readNestedValue(record: Record<string, unknown>, path: string[]): unknown {
  let current: unknown = record;
  for (const key of path) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readNestedString(record: Record<string, unknown>, path: string[]): string | undefined {
  return readString(readNestedValue(record, path));
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

export { formatNaira, formatMoney, CURRENCY_CODE, CURRENCY_SYMBOL } from "@/lib/currency";
import { formatNaira } from "@/lib/currency";

/** Price for a tier + duration (admin stores prices on tier.durations, not tier.price_amount). */
export function tierDurationPrice(
  tier: BoostTierView,
  days: number,
  globalDurations: BoostDurationView[],
): number | null {
  const tierDuration = tier.durations?.find((d) => d.days === days && d.enabled);
  if (tierDuration && tierDuration.priceAmount > 0) {
    return tierDuration.priceAmount;
  }
  const global = globalDurations.find((d) => d.days === days && d.enabled);
  if (global && global.priceAmount > 0) {
    return global.priceAmount;
  }
  if (tier.priceAmount > 0) {
    return tier.priceAmount;
  }
  return null;
}

export function formatTierPriceRange(tier: BoostTierView, globalDurations: BoostDurationView[]): string {
  const prices = [7, 14, 30]
    .map((days) => tierDurationPrice(tier, days, globalDurations))
    .filter((price): price is number => price !== null && price > 0);

  if (prices.length === 0) {
    return formatNaira(tier.priceAmount);
  }
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) {
    return formatNaira(min);
  }
  return `${formatNaira(min)} – ${formatNaira(max)}`;
}

export function getSelectableDurationsForTier(
  tier: BoostTierView | null,
  boost: NonNullable<ParsedLocationOption["boost"]>,
): BoostDurationView[] {
  if (tier?.durations?.length) {
    return tier.durations.filter((d) => d.enabled && d.priceAmount > 0);
  }
  return boost.durations.filter((d) => d.enabled && d.priceAmount > 0);
}

export function resolveBoostSelectionPrice(
  location: ParsedLocationOption,
  tierKey: string,
  durationDays: number,
): { amount: number; tierLabel: string } | null {
  const boost = location.boost;
  if (!boost?.enabled) return null;
  const tier = boost.tiers.find((t) => t.key === tierKey);
  if (!tier) return null;
  const amount = tierDurationPrice(tier, durationDays, boost.durations);
  if (amount === null) return null;
  return { amount, tierLabel: tier.label };
}

export function parseBoostData(raw: unknown): ParsedLocationOption["boost"] {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const tiersRaw = Array.isArray(record.tiers) ? record.tiers : [];
  const durationsRaw = Array.isArray(record.durations) ? record.durations : [];
  const statsRaw =
    record.stats && typeof record.stats === "object"
      ? (record.stats as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  return {
    enabled: Boolean(record.enabled),
    tiers: tiersRaw.flatMap((tier, index): BoostTierView[] => {
      if (!tier || typeof tier !== "object") return [];
      const tierRecord = tier as Record<string, unknown>;
      const nestedDurations = Array.isArray(tierRecord.durations) ? tierRecord.durations : [];
      const tierDurations = nestedDurations
        .map((duration) => {
          if (!duration || typeof duration !== "object") return null;
          const durationRecord = duration as Record<string, unknown>;
          return {
            days: toNumber(durationRecord.days ?? durationRecord.duration_days),
            enabled: Boolean(durationRecord.enabled ?? durationRecord.is_active ?? true),
            priceAmount: toNumber(
              durationRecord.price_amount ?? durationRecord.priceAmount ?? durationRecord.price,
            ),
          } satisfies BoostDurationView;
        })
        .filter((duration): duration is BoostDurationView => duration !== null && duration.days > 0);

      const totalSlots = toNumber(tierRecord.total_slots ?? tierRecord.totalSlots);
      const slotsOccupied = toNumber(tierRecord.slots_occupied ?? tierRecord.slotsOccupied);
      const slotsRemainingRaw = tierRecord.slots_remaining ?? tierRecord.slotsRemaining;
      const slotsRemaining =
        slotsRemainingRaw !== undefined && slotsRemainingRaw !== null
          ? toNumber(slotsRemainingRaw)
          : Math.max(0, totalSlots - slotsOccupied);

      return [
        {
          key: readString(tierRecord.key) ?? `tier-${index + 1}`,
          label: readString(tierRecord.label) ?? readString(tierRecord.name) ?? `Tier ${index + 1}`,
          totalSlots,
          slotsOccupied,
          slotsRemaining,
          isAvailable:
            tierRecord.is_available !== undefined
              ? Boolean(tierRecord.is_available ?? tierRecord.isAvailable)
              : totalSlots > 0 && slotsRemaining > 0,
          priceAmount: toNumber(tierRecord.price_amount ?? tierRecord.priceAmount ?? tierRecord.price),
          durations: tierDurations.length > 0 ? tierDurations : undefined,
        },
      ];
    }),
    durations: durationsRaw
      .map((duration) => {
        if (!duration || typeof duration !== "object") return null;
        const durationRecord = duration as Record<string, unknown>;
        return {
          days: toNumber(durationRecord.days ?? durationRecord.duration_days),
          enabled: Boolean(durationRecord.enabled ?? durationRecord.is_active),
          priceAmount: toNumber(durationRecord.price_amount ?? durationRecord.priceAmount ?? durationRecord.price),
        } satisfies BoostDurationView;
      })
      .filter((duration): duration is BoostDurationView => duration !== null && duration.days > 0),
    stats: {
      totalSlots: toNumber(statsRaw.total_slots ?? statsRaw.totalSlots),
      slotsSold: toNumber(statsRaw.slots_sold ?? statsRaw.slotsSold),
      slotsRemaining: toNumber(statsRaw.slots_remaining ?? statsRaw.slotsRemaining),
      activeBoosts: toNumber(statsRaw.active_boosts ?? statsRaw.activeBoosts),
      expiredBoosts: toNumber(statsRaw.expired_boosts ?? statsRaw.expiredBoosts),
    },
  };
}

export function formatLocationLabel(state: string, lga: string, city?: string): string {
  const parts = [state, city?.trim() || null, lga].filter(Boolean);
  return parts.join(" / ");
}

export function parseVendorLocationOptions(raw: unknown): ParsedLocationOption[] {
  const rows = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as Record<string, unknown>).data)
      ? ((raw as Record<string, unknown>).data as unknown[])
      : [];
  if (rows.length === 0) return [];

  return rows
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const state = readNestedString(record, ["state", "name"]);
      const city = readNestedString(record, ["city", "name"]) ?? "";
      const lga = readNestedString(record, ["lga", "name"]);
      const country = readNestedString(record, ["country", "name"]) ?? "Nigeria";
      const idValue = readString(record.id) ?? String(record.id ?? `${state}-${lga}-${index}`);
      if (!state || !lga) return null;

      return {
        id: idValue,
        location: country,
        state,
        city,
        lga,
        label: formatLocationLabel(state, lga, city),
        boost: parseBoostData(readNestedValue(record, ["lga", "boost"])),
      } satisfies ParsedLocationOption;
    })
    .filter((entry): entry is ParsedLocationOption => entry !== null);
}

/** Admin-managed LGAs where boost is enabled — used for vendor boost targeting. */
export function parseVendorBoostLocationOptions(raw: unknown): ParsedLocationOption[] {
  return parseVendorLocationOptions(raw).filter((entry) => entry.boost?.enabled === true);
}

/** Parse boost-enabled rows even when nested boost.enabled is missing (pre-filtered API lists). */
export function parseVendorBoostLocationList(raw: unknown, assumeBoostEnabled = false): ParsedLocationOption[] {
  const parsed = parseVendorLocationOptions(raw);
  if (assumeBoostEnabled) {
    return parsed.map((entry) => ({
      ...entry,
      boost: entry.boost ?? { enabled: true, tiers: [], durations: [], stats: { totalSlots: 0, slotsSold: 0, slotsRemaining: 0 } },
    }));
  }
  return parseVendorBoostLocationOptions(raw);
}

export function uniqueLocationStates(locations: ParsedLocationOption[]): string[] {
  return [...new Set(locations.map((entry) => entry.state))].sort((a, b) => a.localeCompare(b));
}

export function uniqueLocationCities(locations: ParsedLocationOption[], state: string): string[] {
  if (!state) return [];
  return [...new Set(locations.filter((entry) => entry.state === state).map((entry) => entry.city))].sort(
    (a, b) => a.localeCompare(b),
  );
}

export function uniqueLocationLgas(locations: ParsedLocationOption[], state: string): string[] {
  if (!state) return [];
  return [...new Set(locations.filter((entry) => entry.state === state).map((entry) => entry.lga))].sort(
    (a, b) => a.localeCompare(b),
  );
}

export function uniqueLocationCitiesForStateLga(
  locations: ParsedLocationOption[],
  state: string,
  lga: string,
): string[] {
  if (!state || !lga) return [];
  return [
    ...new Set(
      locations.filter((entry) => entry.state === state && entry.lga === lga).map((entry) => entry.city),
    ),
  ].sort((a, b) => a.localeCompare(b));
}

export function locationEntryForStateLgaCity(
  locations: ParsedLocationOption[],
  state: string,
  lga: string,
  city: string,
): ParsedLocationOption | null {
  if (!state || !lga || !city) return null;
  return locations.find((entry) => entry.state === state && entry.lga === lga && entry.city === city) ?? null;
}

export function locationEntriesForStateCity(
  locations: ParsedLocationOption[],
  state: string,
  city: string,
): ParsedLocationOption[] {
  if (!state || !city) return [];
  return locations.filter((entry) => entry.state === state && entry.city === city);
}
