import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { BasicBoost } from "@/components/sections/vendor/boost/BasicBoost";
import { BoostConfigureHeader } from "@/components/sections/vendor/boost/boostConfigure/BoostConfigureHeader";
import { BoostScheduleCard } from "@/components/sections/vendor/boost/boostConfigure/BoostScheduleCard";
import { EstimatedReachCard } from "@/components/sections/vendor/boost/boostConfigure/EstimatedReachCard";
import { TargetLocationCard } from "@/components/sections/vendor/boost/boostConfigure/TargetLocationCard";
import { fetchVendorBoostCatalog } from "@/features/boost/vendorBoostApi";
import type { ParsedLocationOption } from "@/features/locations/vendorLocationOptions";
import { useVendorSubscriptionAccess } from "@/hooks/useVendorSubscriptionAccess";

export default function VendorBoostConfigurePage() {
  const { isPremiumActive, isLoading } = useVendorSubscriptionAccess();

  const { data: catalog } = useQuery({
    queryKey: ["vendor", "boost", "catalog"],
    queryFn: fetchVendorBoostCatalog,
    enabled: isPremiumActive,
    staleTime: 30_000,
  });

  const activeLocation = useMemo(
    () => (catalog?.location ?? null) as ParsedLocationOption | null,
    [catalog?.location],
  );

  if (isLoading) {
    return (
      <BoostConfigureLoader />
    );
  }

  return (
    <div className="p-4 md:p-6">
      {isPremiumActive ? (
        <div className="space-y-4">
          <BoostConfigureHeader />

          <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
            <div className="space-y-4">
              <TargetLocationCard location={activeLocation} readOnly />
              <BoostScheduleCard />
            </div>
            <EstimatedReachCard />
          </div>
        </div>
      ) : (
        <BasicBoost />
      )}
    </div>
  );
}

function BoostConfigureLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-6">
      <Loader2 className="size-8 animate-spin text-brand-red" aria-label="Loading boost setup" />
    </div>
  );
}
