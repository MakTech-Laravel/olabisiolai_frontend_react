import {
  formatNaira,
  formatTierPriceRange,
  type ParsedLocationOption,
} from "@/features/locations/vendorLocationOptions";

type VendorLocationBoostDetailsProps = {
  location: ParsedLocationOption;
  /** Profile view: informational only. Create form passes interactive controls separately. */
  readOnly?: boolean;
};

export function VendorLocationBoostDetails({ location, readOnly = true }: VendorLocationBoostDetailsProps) {
  const boost = location.boost;

  if (!boost?.enabled) {
    return (
      <p className="mt-2 text-xs text-muted-foreground">
        This location has no active slot configuration yet.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-md border border-sky-100 bg-white px-3 py-2">
          <p className="text-[11px] uppercase text-muted-foreground">Total slots</p>
          <p className="text-lg font-semibold text-foreground">{boost.stats.totalSlots}</p>
        </div>
        <div className="rounded-md border border-sky-100 bg-white px-3 py-2">
          <p className="text-[11px] uppercase text-muted-foreground">Sold</p>
          <p className="text-lg font-semibold text-foreground">{boost.stats.slotsSold}</p>
        </div>
        <div className="rounded-md border border-sky-100 bg-white px-3 py-2">
          <p className="text-[11px] uppercase text-muted-foreground">Remaining</p>
          <p className="text-lg font-semibold text-foreground">{boost.stats.slotsRemaining}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Top slots & pricing</p>
        {boost.tiers.length > 0 ? (
          <ul className="grid gap-2">
            {boost.tiers.map((tier) => (
              <li
                key={tier.key}
                className="rounded-md border border-sky-100 bg-white px-3 py-2 text-xs text-foreground"
              >
                <p className="font-semibold">{tier.label}</p>
                <p className="text-muted-foreground">Slots: {tier.totalSlots}</p>
                <p className="mt-1 text-muted-foreground">
                  {formatTierPriceRange(tier, boost.durations)}
                </p>
                {tier.durations && tier.durations.length > 0 ? (
                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {tier.durations
                      .filter((d) => d.enabled && d.priceAmount > 0)
                      .map((d) => (
                        <li
                          key={`${tier.key}-${d.days}`}
                          className="rounded border border-sky-50 bg-sky-50/50 px-2 py-0.5"
                        >
                          {d.days}d — {formatNaira(d.priceAmount)}
                        </li>
                      ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No top slot config found for this location.</p>
        )}
      </div>

      {readOnly ? (
        <p className="text-xs text-sky-900">
          Boost slots are available for this LGA. Manage an active boost from the Boost page.
        </p>
      ) : null}
    </div>
  );
}
