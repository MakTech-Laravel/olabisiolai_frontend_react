import { type ParsedLocationOption } from "@/features/locations/vendorLocationOptions";

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
        Boost is not available for this location yet. Choose another LGA or contact support.
      </p>
    );
  }

  const activeBoosts = toNumber(boost.stats.activeBoosts);
  const expiredBoosts = toNumber(boost.stats.expiredBoosts);

  return (
    <div className="mt-4 space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-md border border-sky-100 bg-white px-3 py-2">
          <p className="text-[11px] uppercase text-muted-foreground">Active boosts</p>
          <p className="text-lg font-semibold text-foreground">{activeBoosts}</p>
        </div>
        <div className="rounded-md border border-sky-100 bg-white px-3 py-2">
          <p className="text-[11px] uppercase text-muted-foreground">Expired</p>
          <p className="text-lg font-semibold text-foreground">{expiredBoosts}</p>
        </div>
      </div>

      {readOnly ? (
        <p className="text-xs text-sky-900">
          This LGA is available for vendor boosts. Start or manage a campaign from the Boost page.
        </p>
      ) : null}
    </div>
  );
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}
