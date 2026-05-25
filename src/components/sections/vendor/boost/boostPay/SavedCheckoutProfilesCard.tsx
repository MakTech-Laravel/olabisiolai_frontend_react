import { Card, CardContent } from "@/components/ui/card";
import type { VendorPaymentMethod } from "@/features/vendor/vendorPaymentsApi";
import { cn } from "@/lib/utils";
import { CreditCard } from "lucide-react";

export function SavedCheckoutProfilesCard({
  items,
  selectedId,
  onSelect,
}: {
  items: VendorPaymentMethod[];
  selectedId: number | null;
  onSelect: (id: number | null, method: VendorPaymentMethod | null) => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h2 className="font-inter text-base font-semibold uppercase text-foreground">Saved profiles</h2>
      <p className="text-xs text-muted-foreground">
        Selecting a profile fills billing details for Flutterwave. Card number and CVV are always entered in the secure
        payment window — we only store masked card metadata when available.
      </p>
      <Card
        className={cn("cursor-pointer transition-colors", selectedId === null ? "border-brand-red" : "")}
        onClick={() => onSelect(null, null)}
      >
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="font-inter text-sm font-semibold">Manual / account defaults</p>
            <p className="font-inter text-xs text-muted-foreground">Do not apply a saved profile</p>
          </div>
          {selectedId === null ? (
            <div className="rounded-full border-2 border-brand-red p-1">
              <div className="size-3 rounded-full bg-brand-red" />
            </div>
          ) : (
            <div className="size-6 rounded-full border" />
          )}
        </CardContent>
      </Card>
      {items.map((m) => {
        const label = m.label ?? m.card_brand ?? "Saved profile";
        const mask = m.last_four ? `•••• ${m.last_four}` : "Billing only";
        const active = selectedId === m.id;
        return (
          <Card
            key={m.id}
            className={cn("cursor-pointer transition-colors", active ? "border-brand-red" : "")}
            onClick={() => onSelect(m.id, m)}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="inline-flex items-center gap-3">
                <div
                  className={cn(
                    "rounded-md p-2",
                    active ? "bg-red-50 text-brand-red" : "bg-slate-100 text-slate-700",
                  )}
                >
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <p className="font-inter text-sm font-semibold">{label}</p>
                  <p className="font-inter text-xs text-muted-foreground">{mask}</p>
                  <p className="font-inter text-xs text-muted-foreground">{m.cardholder_name}</p>
                </div>
              </div>
              {active ? (
                <div className="rounded-full border-2 border-brand-red p-1">
                  <div className="size-3 rounded-full bg-brand-red" />
                </div>
              ) : (
                <div className="size-6 rounded-full border" />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
