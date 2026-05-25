import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";

import { buildPlansFromLocationBoost } from "@/features/boost/locationBoostPlans";
import type { ParsedLocationOption } from "@/features/locations/vendorLocationOptions";
import { formatNaira } from "@/features/locations/vendorLocationOptions";
import { useVendorSubscriptionAccess } from "@/hooks/useVendorSubscriptionAccess";

export function BasicBoost({ previewLocation = null }: { previewLocation?: ParsedLocationOption | null }) {
  const { goToPremiumPayment } = useVendorSubscriptionAccess();

  const previewPlans = useMemo(() => {
    if (!previewLocation?.boost?.enabled) return [];
    return buildPlansFromLocationBoost(previewLocation).slice(0, 3);
  }, [previewLocation]);

  return (
    <div className="relative">
      {/* Full Page Overlay */}
      <div className="absolute inset-0 bg-white/40 z-20 flex flex-col items-center justify-center gap-3 p-8">
        <div className="w-13 h-13 rounded-full bg-brand-red flex items-center justify-center p-3">
          <Lock className="text-popover-foreground w-6 h-6" />
        </div>
        <p className="text-lg font-semibold text-popover-foreground">Upgrade to Premium</p>
        <p className="text-sm text-popover-foreground text-center max-w-[260px]">
          Unlock premium boost plans, enhanced visibility, and advanced promotional features.
        </p>
        <button
          type="button"
          onClick={goToPremiumPayment}
          className="cursor-pointer rounded-full bg-red-600 px-6 py-3 text-sm font-medium text-text-white hover:bg-brand-red"
        >
          Get Premium Access
        </button>
      </div>

      <Card className="opacity-40 h-screen">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold font-inter mb-5">Boost Plans</h2>

          {/* Plan Cards */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            {(previewPlans.length > 0
              ? previewPlans.map((plan) => ({
                name: plan.title,
                price: plan.pricingOptions[0]?.price ?? formatNaira(0),
                features: plan.features.filter((f) => f.checked).map((f) => f.text),
              }))
              : [
                { name: "Top 10 Boost", price: "—", features: ["Location-based pricing"] },
                { name: "Top 5 Boost", price: "—", features: ["Select your LGA first"] },
                { name: "Top 1 Exclusive", price: "—", features: ["Unlock with Premium"] },
              ]
            ).map((plan, index) => (
              <div key={index} className="bg-muted rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                <p className="text-2xl font-bold mb-3">{plan.price}</p>
                <ul className="text-sm space-y-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="text-muted-foreground">• {feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Locked Features Section */}
          <div className="relative border rounded-lg overflow-hidden min-h-[200px]">
            {/* Blurred Content */}
            <div className="p-4 blur-sm opacity-30 pointer-events-none">
              <h3 className="text-lg font-semibold mb-3">Premium Benefits</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-2 bg-red-500 rounded"></div>
                  <div className="h-2 bg-red-500 rounded w-3/4"></div>
                  <div className="h-2 bg-red-500 rounded w-1/2"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-red-500 rounded"></div>
                  <div className="h-2 bg-red-500 rounded w-2/3"></div>
                  <div className="h-2 bg-red-500 rounded w-4/5"></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
