import type { ReactNode } from "react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, MapPin } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useVendorBusinessFormOptions } from "@/features/categories/useVendorBusinessFormOptions";
import { parseVendorLocationOptions } from "@/features/locations/vendorLocationOptions";
import { fetchVendorBoostCatalog } from "@/features/boost/vendorBoostApi";
import { VendorProfileActiveBoostCard } from "@/components/sections/vendor/profile/VendorProfileActiveBoostCard";
import { useVendorProfileContext } from "@/components/sections/vendor/profile/VendorProfileContext";

const PROFILE_BOOST_STATUSES = new Set(["active", "pending_admin", "pending_payment"]);

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

function SelectField({
  label,
  value,
  disabled,
  onChange,
  children,
}: {
  label: ReactNode;
  value: string;
  disabled?: boolean;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  children: ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            "h-11 w-full appearance-none rounded-md border border-border-light bg-background px-3 pr-12 text-sm text-foreground shadow-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/25",
            disabled && "cursor-not-allowed opacity-80",
          )}
        >
          {children}
        </select>
        <MapPin className="pointer-events-none absolute right-9 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <ChevronRight className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 rotate-90 text-muted-foreground" />
      </div>
    </div>
  );
}

export function VendorProfileLocationSection() {
  const { profile, isEditing, draft, setDraftField, fieldErrors } = useVendorProfileContext();
  const { data: formOptions, isPending } = useVendorBusinessFormOptions();
  const parsedLocations = useMemo(
    () => parseVendorLocationOptions(formOptions?.locations),
    [formOptions?.locations],
  );

  const locationId = isEditing && draft ? draft.locationId : String(profile?.locationId || "");
  const selectedLocation = useMemo(
    () => parsedLocations.find((entry) => entry.id === locationId) ?? null,
    [parsedLocations, locationId],
  );

  const { data: boostCatalog } = useQuery({
    queryKey: ["vendor", "boost", "catalog"],
    queryFn: fetchVendorBoostCatalog,
    staleTime: 30_000,
  });

  const locationNumericId = Number(locationId);

  const locationBoostCampaigns = useMemo(() => {
    if (!Number.isFinite(locationNumericId) || locationNumericId <= 0) return [];
    return (boostCatalog?.campaigns ?? []).filter(
      (row) =>
        row.location?.id === locationNumericId &&
        row.display_status !== "extension_merged" &&
        !row.is_extension_record &&
        PROFILE_BOOST_STATUSES.has(row.display_status),
    );
  }, [boostCatalog?.campaigns, locationNumericId]);

  const showBoostOnProfile =
    locationBoostCampaigns.length > 0 ||
    (boostCatalog?.pendingRequest != null &&
      (boostCatalog.location?.id === locationId ||
        boostCatalog.location?.id === String(locationNumericId)));

  if (!profile) return null;

  const state = selectedLocation?.state || profile.state || "";
  const city = selectedLocation?.city || profile.city || "";
  const lga = selectedLocation?.lga || profile.lga || "";

  return (
    <div className="space-y-5">
      <SelectField
        label="Location"
        value={locationId}
        disabled={!isEditing || isPending}
        onChange={(e) => setDraftField("locationId", e.target.value)}
      >
        <option value="">
          {isPending ? "Loading locations…" : "Select location"}
        </option>
        {parsedLocations.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </SelectField>
      {fieldErrors.location_id ? (
        <p className="text-xs text-destructive">{fieldErrors.location_id}</p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label>State</Label>
          <Input value={state} readOnly className="h-11 border-border-light bg-background text-sm shadow-sm" />
        </div>
        <div>
          <Label>City</Label>
          <Input value={city} readOnly className="h-11 border-border-light bg-background text-sm shadow-sm" />
        </div>
      </div>

      <div>
        <Label>LGA (Local Government Area)</Label>
        <Input value={lga} readOnly className="h-11 border-border-light bg-background text-sm shadow-sm" />
      </div>

      {selectedLocation && showBoostOnProfile ? (
        <VendorProfileActiveBoostCard
          campaigns={locationBoostCampaigns}
          pendingRequest={
            boostCatalog?.location?.id === locationId ||
              boostCatalog?.location?.id === String(locationNumericId)
              ? boostCatalog.pendingRequest
              : null
          }
          locationLabel={`${selectedLocation.state} / ${selectedLocation.city} / ${selectedLocation.lga}`}
        />
      ) : locationId ? (
        <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-4 text-sm text-amber-900">
          Location details could not be matched to the catalog. Showing saved address:{" "}
          <span className="font-medium">{profile.locationFullName || profile.locationLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
