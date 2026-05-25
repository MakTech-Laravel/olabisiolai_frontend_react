import type { BoostTierView, ParsedLocationOption } from "@/features/locations/vendorLocationOptions";

export function tierSlotsRemaining(tier: BoostTierView): number {
  if (typeof tier.slotsRemaining === "number") {
    return tier.slotsRemaining;
  }
  const total = tier.totalSlots ?? 0;
  const occupied = tier.slotsOccupied ?? 0;
  return Math.max(0, total - occupied);
}

export function isTierSlotAvailable(tier: BoostTierView): boolean {
  if (typeof tier.isAvailable === "boolean") {
    return tier.isAvailable;
  }
  const total = tier.totalSlots ?? 0;
  if (total <= 0) {
    return false;
  }
  return tierSlotsRemaining(tier) > 0;
}

export function getAvailableTiers(location: ParsedLocationOption | null): BoostTierView[] {
  if (!location?.boost?.enabled) {
    return [];
  }
  return location.boost.tiers.filter(isTierSlotAvailable);
}

export function locationHasAnyBoostSlot(location: ParsedLocationOption | null): boolean {
  return getAvailableTiers(location).length > 0;
}

export function tierSlotStatusLabel(tier: BoostTierView): string {
  const remaining = tierSlotsRemaining(tier);
  const total = tier.totalSlots ?? 0;
  if (total <= 0) {
    return "Not configured";
  }
  if (remaining <= 0) {
    return "No slots available — fully booked";
  }
  if (remaining === 1) {
    return "1 slot available in this LGA";
  }
  return `${remaining} slots available in this LGA`;
}

export function locationAllSlotsFullMessage(location: ParsedLocationOption): string {
  return `All boost slots are booked for ${location.label}. You cannot purchase a boost here right now. Try another location or check back later.`;
}

export function tierSlotFullMessage(tier: BoostTierView, location: ParsedLocationOption): string {
  return `${tier.label} has no free slots in ${location.lga}. This plan is fully booked for your selected location.`;
}
