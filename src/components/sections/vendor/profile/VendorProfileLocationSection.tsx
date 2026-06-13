import type { ReactNode } from "react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, MapPin } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useVendorBusinessFormOptions } from "@/features/categories/useVendorBusinessFormOptions";
import {
  locationEntriesForStateCity,
  parseVendorLocationOptions,
  uniqueLocationCities,
  uniqueLocationStates,
} from "@/features/locations/vendorLocationOptions";
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

  const profileState = selectedLocation?.state || profile?.state || "";
  const profileCity = selectedLocation?.city || profile?.city || "";
  const profileLga = selectedLocation?.lga || profile?.lga || "";

  const allStates = useMemo(() => uniqueLocationStates(parsedLocations), [parsedLocations]);
  const citiesForState = useMemo(
    () => uniqueLocationCities(parsedLocations, profileState),
    [parsedLocations, profileState],
  );
  const lgaOptions = useMemo(
    () => locationEntriesForStateCity(parsedLocations, profileState, profileCity),
    [parsedLocations, profileState, profileCity],
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

  const savedLocationOption = useMemo(() => {
    if (!profile?.locationId || profile.locationId <= 0) return null;
    const id = String(profile.locationId);
    if (parsedLocations.some((entry) => entry.id === id)) return null;
    const label =
      profile.locationFullName ||
      [profile.state, profile.city, profile.lga].filter(Boolean).join(" / ") ||
      profile.locationLabel;
    if (!label.trim()) return null;
    return { id, label, state: profile.state, city: profile.city, lga: profile.lga };
  }, [parsedLocations, profile]);

  if (!profile) return null;

  const streetAddress = isEditing && draft ? draft.streetAddress : profile.streetAddress;

  const handleStateChange = (nextState: string) => {
    if (!draft) return;
    const nextCity = uniqueLocationCities(parsedLocations, nextState)[0] ?? "";
    const nextEntry = locationEntriesForStateCity(parsedLocations, nextState, nextCity)[0];
    setDraftField("locationId", nextEntry?.id ?? "");
  };

  const handleCityChange = (nextCity: string) => {
    if (!draft) return;
    const nextEntry = locationEntriesForStateCity(parsedLocations, profileState, nextCity)[0];
    setDraftField("locationId", nextEntry?.id ?? "");
  };

  return (
    <div className="space-y-5">
      <div>
        <Label>Street address</Label>
        {isEditing && draft ? (
          <Textarea
            value={streetAddress}
            onChange={(e) => setDraftField("streetAddress", e.target.value)}
            rows={2}
            placeholder="Street name and number, building, landmark…"
            className="min-h-[72px] resize-y border-border-light bg-background text-sm leading-relaxed shadow-sm focus-visible:ring-2 focus-visible:ring-sky-500/25"
          />
        ) : (
          <Input
            value={streetAddress || "—"}
            readOnly
            className="h-11 border-border-light bg-background text-sm shadow-sm"
          />
        )}
      </div>

      {isEditing && draft ? (
        <>
          <SelectField
            label="State"
            value={profileState}
            disabled={isPending || allStates.length === 0}
            onChange={(e) => handleStateChange(e.target.value)}
          >
            <option value="">{isPending ? "Loading states…" : "Select state"}</option>
            {savedLocationOption && !allStates.includes(savedLocationOption.state) ? (
              <option value={savedLocationOption.state}>{savedLocationOption.state}</option>
            ) : null}
            {allStates.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </SelectField>

          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              label="City"
              value={profileCity}
              disabled={!profileState || citiesForState.length === 0}
              onChange={(e) => handleCityChange(e.target.value)}
            >
              <option value="">Select city</option>
              {savedLocationOption &&
              savedLocationOption.state === profileState &&
              !citiesForState.includes(savedLocationOption.city) ? (
                <option value={savedLocationOption.city}>{savedLocationOption.city}</option>
              ) : null}
              {citiesForState.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="LGA (Local Government Area)"
              value={locationId}
              disabled={!profileCity || lgaOptions.length === 0}
              onChange={(e) => setDraftField("locationId", e.target.value)}
            >
              <option value="">Select LGA</option>
              {savedLocationOption &&
              savedLocationOption.state === profileState &&
              savedLocationOption.city === profileCity &&
              !lgaOptions.some((entry) => entry.id === savedLocationOption.id) ? (
                <option value={savedLocationOption.id}>{savedLocationOption.lga}</option>
              ) : null}
              {lgaOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.lga}
                </option>
              ))}
            </SelectField>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label>State</Label>
              <Input value={profileState || "—"} readOnly className="h-11 border-border-light bg-background text-sm shadow-sm" />
            </div>
            <div>
              <Label>City</Label>
              <Input value={profileCity || "—"} readOnly className="h-11 border-border-light bg-background text-sm shadow-sm" />
            </div>
          </div>
          <div>
            <Label>LGA (Local Government Area)</Label>
            <Input value={profileLga || "—"} readOnly className="h-11 border-border-light bg-background text-sm shadow-sm" />
          </div>
        </>
      )}

      {isEditing && fieldErrors.location_id ? (
        <p className="text-xs text-destructive">{fieldErrors.location_id}</p>
      ) : null}

      {selectedLocation && showBoostOnProfile ? (
        <VendorProfileActiveBoostCard
          campaigns={locationBoostCampaigns}
          pendingRequest={
            boostCatalog?.location?.id === locationId ||
              boostCatalog?.location?.id === String(locationNumericId)
              ? boostCatalog?.pendingRequest ?? null
              : null
          }
          locationLabel={`${selectedLocation.state} / ${selectedLocation.city} / ${selectedLocation.lga}`}
        />
      ) : locationId && !selectedLocation && !savedLocationOption ? (
        <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-4 text-sm text-amber-900">
          Location details could not be matched to the catalog. Please pick state, city, and LGA from the list, or
          keep your saved address:{" "}
          <span className="font-medium">{profile.locationFullName || profile.locationLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
