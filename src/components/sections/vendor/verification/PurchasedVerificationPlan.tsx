import { BadgeCheck } from "lucide-react";

import type { PurchasedVerificationPackage } from "@/features/verification/vendorVerificationApi";
import { formatNaira } from "@/lib/currency";
import { plans } from "./verificationData";

export function PurchasedVerificationPlan({
  purchased,
}: {
  purchased: PurchasedVerificationPackage;
}) {
  const planMeta = plans.find((p) => p.id === purchased.id);
  const amountLabel = formatNaira(Number(purchased.amount), { freeLabel: false });

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-4 md:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <BadgeCheck className="size-5" aria-hidden />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
              Your verification package
            </p>
            <p className="text-base font-semibold text-emerald-950">
              {purchased.title} · {amountLabel}
            </p>
            {purchased.paid_at ? (
              <p className="text-xs text-emerald-800/90">Paid on {purchased.paid_at}</p>
            ) : null}
          </div>
        </div>
        <span className="inline-flex w-fit shrink-0 rounded-full bg-emerald-700 px-3 py-1 text-xs font-semibold text-white">
          Purchased
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-emerald-950">{purchased.usage_message}</p>
      {planMeta ? (
        <p className="mt-2 text-xs leading-relaxed text-emerald-900/80">{planMeta.description}</p>
      ) : purchased.description ? (
        <p className="mt-2 text-xs leading-relaxed text-emerald-900/80">{purchased.description}</p>
      ) : null}
    </div>
  );
}
