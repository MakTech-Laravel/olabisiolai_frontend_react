import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { fetchVerificationPackages } from "@/features/verification/vendorVerificationApi";
import { formatNaira } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { plans, plansWithApiPricing, type PlanId } from "./verificationData";
import { TierRadio } from "./TierRadio";

export function VerificationPlansGrid({
  selectedId,
  onPlanSelect,
}: {
  selectedId: PlanId;
  onPlanSelect: (id: PlanId) => void;
}) {
  const { data: packagesData } = useQuery({
    queryKey: ["vendor", "verification", "packages"],
    queryFn: fetchVerificationPackages,
    staleTime: 60_000,
  });

  const displayPlans = useMemo(
    () => plansWithApiPricing(plans, packagesData?.packages),
    [packagesData?.packages],
  );

  return (
    <div
      className="grid gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3"
      role="radiogroup"
      aria-label="Verification tier"
    >
      {displayPlans.map((plan) => {
        const selected = selectedId === plan.id;
        const Icon = plan.icon;
        return (
          <button
            key={plan.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onPlanSelect(plan.id)}
            className={cn(
              "flex h-full flex-col rounded-2xl border border-border-light bg-card p-5 text-left shadow-sm transition-all md:p-6",
              plan.surface === "white" ? "bg-card" : "bg-[#eef2fb]",
              selected
                ? "border-brand-red ring-2 ring-brand-red/25"
                : "hover:border-neutral-300",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-brand-red text-white shadow-sm">
                <Icon className="size-5" strokeWidth={2} aria-hidden />
              </div>
              <div className="flex flex-1 items-start justify-end gap-3">
                <p className="text-2xl font-bold leading-none tracking-tight text-slate-900 md:text-[26px]">
                  {formatNaira(plan.amount, { freeLabel: false })}
                </p>
                <TierRadio selected={selected} />
              </div>
            </div>

            <div className="mt-5 flex-1 space-y-2 max-w-[230px]">
              <h2 className="text-xl font-bold text-slate-900 font-manrope md:text-2xl">{plan.title}</h2>
              <p className="text-sm leading-relaxed text-slate-600">{plan.description}</p>
            </div>

            <div className="mt-5 space-y-2 border-t border-border-light pt-4">
              {plan.perkStyle === "badge" ? (
                plan.perks.map((perk) => (
                  <p
                    key={perk}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-vendor-header"
                  >
                    <Check className="size-4 shrink-0 text-white bg-[#0B1C30] rounded-full p-0.5" strokeWidth={3} aria-hidden />
                    {perk}
                  </p>
                ))
              ) : (
                plan.perks.map((perk) => (
                  <p
                    key={perk}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-foreground"
                  >
                    <Check className="size-4 shrink-0 text-white bg-[#0B1C30] rounded-full p-0.5" strokeWidth={3} aria-hidden />
                    {perk}
                  </p>
                ))
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
