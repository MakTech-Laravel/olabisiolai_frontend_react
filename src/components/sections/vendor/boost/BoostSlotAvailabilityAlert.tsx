import { AlertCircle, CheckCircle2 } from "lucide-react";

import {
  getAvailableTiers,
  locationAllSlotsFullMessage,
  locationHasAnyBoostSlot,
} from "@/features/boost/boostSlotAvailability";
import type { ParsedLocationOption } from "@/features/locations/vendorLocationOptions";
import { cn } from "@/lib/utils";

type Props = {
  location: ParsedLocationOption | null;
  className?: string;
};

export function BoostSlotAvailabilityAlert({ location, className }: Props) {
  if (!location?.boost?.enabled) {
    return null;
  }

  const hasSlot = locationHasAnyBoostSlot(location);
  const availableTiers = getAvailableTiers(location);

  if (!hasSlot) {
    return (
      <div
        role="alert"
        className={cn(
          "flex gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900",
          className,
        )}
      >
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden />
        <div>
          <p className="font-semibold">No boost slots available</p>
          <p className="mt-1 text-red-800/90">{locationAllSlotsFullMessage(location)}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900",
        className,
      )}
    >
      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden />
      <div>
        <p className="font-semibold">Slots available in {location.lga}</p>
        <p className="mt-1 text-emerald-800/90">
          You can boost with: {availableTiers.map((t) => t.label).join(", ")}. Fully booked plans
          are disabled until a slot opens.
        </p>
      </div>
    </div>
  );
}
