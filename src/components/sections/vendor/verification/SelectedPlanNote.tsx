import type { PurchasedVerificationPackage } from "@/features/verification/vendorVerificationApi";
import { plans, type PlanId } from "./verificationData";

export function SelectedPlanNote({
  selectedId,
  purchasedPackage,
}: {
  selectedId: PlanId;
  purchasedPackage?: PurchasedVerificationPackage | null;
}) {
  const plan = plans.find((p) => p.id === selectedId);
  if (!plan) return null;

  const isPurchasedPlan = purchasedPackage?.id === selectedId;

  if (isPurchasedPlan && purchasedPackage) {
    return (
      <div className="rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-4 md:px-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">
          Included with your {plan.title} package
        </p>
        <p className="mt-2 text-sm leading-relaxed text-sky-900">{plan.afterPurchaseNote}</p>
      </div>
    );
  }

  if (purchasedPackage) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-4 md:px-5">
        <p className="text-sm text-amber-950">
          You already paid for the <strong>{purchasedPackage.title}</strong> package. Selecting
          another tier here is for reference only — your active verification uses the plan you
          purchased.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-4 md:px-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">
        What happens after you choose {plan.title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-sky-900">{plan.afterPurchaseNote}</p>
    </div>
  );
}
