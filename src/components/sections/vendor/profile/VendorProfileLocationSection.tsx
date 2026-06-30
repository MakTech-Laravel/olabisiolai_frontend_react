import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LocationCascadeSelects } from "@/components/locations/LocationCascadeSelects";
import { useVendorBusinessFormOptions } from "@/features/categories/useVendorBusinessFormOptions";
import {
  locationEntryForStateLgaCity,
  parseVendorLocationOptions,
  uniqueLocationCitiesForStateLga,
  uniqueLocationLgas,
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
  const [draftLga, setDraftLga] = useState("");
  const [draftCity, setDraftCity] = useState("");

  useEffect(() => {
    if (!isEditing) return;
    setDraftState(selectedLocation?.state || profile?.state || "");
    setDraftLga(selectedLocation?.lga || profile?.lga || "");
    setDraftCity(selectedLocation?.city || profile?.city || "");
  }, [isEditing, selectedLocation?.id, profile?.state, profile?.lga, profile?.city]);

  const profileState = isEditing ? draftState : selectedLocation?.state || profile?.state || "";
  const profileLga = isEditing ? draftLga : selectedLocation?.lga || profile?.lga || "";
  const profileCity = isEditing ? draftCity : selectedLocation?.city || profile?.city || "";

  const allStates = useMemo(() => uniqueLocationStates(parsedLocations), [parsedLocations]);
  const lgasForState = useMemo(
    () => uniqueLocationLgas(parsedLocations, isEditing ? draftState : profileState),
    [parsedLocations, isEditing, draftState, profileState],
  );
  const citiesForStateLga = useMemo(
    () =>
      uniqueLocationCitiesForStateLga(
        parsedLocations,
        isEditing ? draftState : profileState,
        isEditing ? draftLga : profileLga,
      ),
    [parsedLocations, isEditing, draftState, draftLga, profileState, profileLga],
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
    setDraftState(nextState);
    setDraftLga("");
    setDraftCity("");
    setDraftField("locationId", "");
  };

  const handleLgaChange = (nextLga: string) => {
    if (!draft) return;
    setDraftLga(nextLga);
    const nextCities = uniqueLocationCitiesForStateLga(parsedLocations, draftState, nextLga);
    const nextCity = nextCities.length === 1 ? nextCities[0] : "";
    setDraftCity(nextCity);
    const nextEntry = locationEntryForStateLgaCity(parsedLocations, draftState, nextLga, nextCity);
    setDraftField("locationId", nextEntry?.id ?? "");
  };

  const handleCityChange = (nextCity: string) => {
    if (!draft) return;
    setDraftCity(nextCity);
    const nextEntry = locationEntryForStateLgaCity(parsedLocations, draftState, draftLga, nextCity);
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
          lga={draftLga}
          city={draftCity}
          states={allStates}
          lgas={lgasForState}
          cities={citiesForStateLga}
          onStateChange={handleStateChange}
          onLgaChange={handleLgaChange}
          onCityChange={handleCityChange}
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
              <Label>LGA (Local Government Area)</Label>
              <Input value={profileLga || "—"} readOnly className="h-11 border-border-light bg-background text-sm shadow-sm" />
            </div>
          </div>
          <div>
            <Label>City</Label>
            <Input value={profileCity || "—"} readOnly className="h-11 border-border-light bg-background text-sm shadow-sm" />
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
          Location details could not be matched to the catalog. Please pick state, LGA, and city from the list, or
          keep your saved address:{" "}
          <span className="font-medium">{profile.locationFullName || profile.locationLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
