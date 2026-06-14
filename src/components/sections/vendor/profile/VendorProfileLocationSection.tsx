import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LocationCascadeSelects } from "@/components/locations/LocationCascadeSelects";
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

  const [draftState, setDraftState] = useState("");
  const [draftCity, setDraftCity] = useState("");

  useEffect(() => {
    if (!isEditing) return;
    setDraftState(selectedLocation?.state || profile?.state || "");
    setDraftCity(selectedLocation?.city || profile?.city || "");
  }, [isEditing, selectedLocation?.id, profile?.state, profile?.city]);

  const profileState = isEditing ? draftState : selectedLocation?.state || profile?.state || "";
  const profileCity = isEditing ? draftCity : selectedLocation?.city || profile?.city || "";
  const profileLga = selectedLocation?.lga || profile?.lga || "";

  const allStates = useMemo(() => uniqueLocationStates(parsedLocations), [parsedLocations]);
  const citiesForState = useMemo(
    () => uniqueLocationCities(parsedLocations, isEditing ? draftState : profileState),
    [parsedLocations, isEditing, draftState, profileState],
  );
  const lgaOptions = useMemo(
    () =>
      locationEntriesForStateCity(
        parsedLocations,
        isEditing ? draftState : profileState,
        isEditing ? draftCity : profileCity,
      ),
    [parsedLocations, isEditing, draftState, draftCity, profileState, profileCity],
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
    setDraftState(nextState);
    setDraftCity(nextCity);
    setDraftField("locationId", nextEntry?.id ?? "");
  };

  const handleCityChange = (nextCity: string) => {
    if (!draft) return;
    const nextEntry = locationEntriesForStateCity(parsedLocations, draftState, nextCity)[0];
    setDraftCity(nextCity);
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
        <LocationCascadeSelects
          state={draftState}
          city={draftCity}
          locationId={locationId}
          states={allStates}
          cities={citiesForState}
          lgaOptions={lgaOptions}
          onStateChange={handleStateChange}
          onCityChange={handleCityChange}
          onLocationChange={(nextId) => setDraftField("locationId", nextId)}
          disabled={isPending}
          stateLoading={isPending}
          savedLocationOption={savedLocationOption}
        />
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
