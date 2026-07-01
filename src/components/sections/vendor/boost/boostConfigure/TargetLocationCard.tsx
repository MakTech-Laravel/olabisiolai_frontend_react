import { Card, CardContent } from "@/components/ui/card";
import type { ParsedLocationOption } from "@/features/locations/vendorLocationOptions";

type Props = {
  location: ParsedLocationOption | null;
  locations?: ParsedLocationOption[];
  selectedLocationId?: string;
  onLocationChange?: (locationId: string) => void;
  readOnly?: boolean;
};

export function TargetLocationCard({
  location,
  locations = [],
  selectedLocationId = "",
  onLocationChange,
  readOnly = false,
}: Props) {
  const selectedEntry =
    locations.find((entry) => entry.id === (selectedLocationId || location?.id || "")) ?? location;
  const states = Array.from(new Set(locations.map((entry) => entry.state).filter(Boolean)));
  const selectedState = selectedEntry?.state ?? "";
  const lgasForState = locations.filter((entry) => entry.state === selectedState);

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <p className="inline-flex items-center gap-2 text-xl font-manrope font-bold">
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-muted text-xl font-manrope font-bold">
            1
          </span>
          {readOnly ? "Your business location" : "Select target location"}
        </p>

        <div className="max-w-xl m-auto grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {readOnly && location ? (
              <div className="rounded-lg border border-sky-100 bg-sky-50/80 px-3 py-3 text-sm">
                <p className="font-semibold text-foreground">{location.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  This is the LGA for your boost campaign.
                </p>
              </div>
            ) : locations.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
                <p className="font-semibold">No boost locations available yet</p>
                <p className="mt-1 text-xs text-amber-900">
                  An admin must add and activate LGAs before you can start a boost. Check back soon or contact support.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <p className="mb-1 text-sm font-semibold font-inter text-muted-foreground">State</p>
                  <select
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={selectedState}
                    onChange={(e) => {
                      const first = locations.find((entry) => entry.state === e.target.value);
                      onLocationChange?.(first?.id ?? "");
                    }}
                    disabled={locations.length === 0}
                  >
                    <option value="">Select state</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="mb-1 text-sm font-semibold font-inter text-muted-foreground">LGA</p>
                  <select
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={selectedLocationId || location?.id || ""}
                    onChange={(e) => onLocationChange?.(e.target.value)}
                    disabled={lgasForState.length === 0}
                  >
                    <option value="">Select LGA</option>
                    {lgasForState.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.city ? `${entry.lga} (${entry.city})` : entry.lga}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <p className="inline-flex items-start gap-2 text-xs text-muted-foreground">
              Choose the LGA where you want more visibility in search results.
            </p>
          </div>
          <div>
            <img src="/src/assets/Background.png" alt="" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
