import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Crown, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  grantAdminPremium,
  type GrantPremiumPaymentHandling,
  type GrantPremiumPaymentMethod,
} from "@/features/payments/adminPremiumApi";
import { alert, showError } from "@/lib/sweetAlert";

export type MoveToPremiumBusiness = {
  id: number;
  name: string;
  vendorName: string;
  vendorEmail?: string;
  plan: "free" | "premium";
};

type MoveToPremiumModalProps = {
  open: boolean;
  business: MoveToPremiumBusiness | null;
  onClose: () => void;
  onSuccess?: () => void;
};

const PACKAGE_OPTIONS = [
  { value: "premium_yearly", label: "Premium yearly — 365 days", days: 365 },
  { value: "premium_monthly", label: "Premium monthly — 30 days", days: 30 },
] as const;

export function MoveToPremiumModal({ open, business, onClose, onSuccess }: MoveToPremiumModalProps) {
  const queryClient = useQueryClient();
  const [paymentHandling, setPaymentHandling] = useState<GrantPremiumPaymentHandling>("recorded");
  const [paymentMethod, setPaymentMethod] = useState<GrantPremiumPaymentMethod>("bank_transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [packageId, setPackageId] = useState<string>("premium_yearly");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const selectedPackage = PACKAGE_OPTIONS.find((p) => p.value === packageId) ?? PACKAGE_OPTIONS[0];

  useEffect(() => {
    if (!open || !business) return;
    setPaymentHandling("recorded");
    setPaymentMethod("bank_transfer");
    setPaymentReference("");
    setPackageId("premium_yearly");
    setAmount("");
    setReason(
      business.name.toLowerCase().includes("gidira")
        ? "Internal Gidira business page — payment waived"
        : "",
    );
    if (business.name.toLowerCase().includes("gidira")) {
      setPaymentHandling("waived");
    }
  }, [open, business]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!business) throw new Error("No business selected.");
      const trimmedReason = reason.trim();
      if (!trimmedReason) throw new Error("A reason is required.");

      const body: Parameters<typeof grantAdminPremium>[0] = {
        business_id: business.id,
        reason: trimmedReason,
        package_id: packageId,
        payment_handling: paymentHandling,
      };

      if (paymentHandling === "recorded") {
        body.payment_method = paymentMethod;
        if (paymentReference.trim()) body.payment_reference = paymentReference.trim();
        if (amount.trim()) {
          const parsed = Number(amount);
          if (!Number.isFinite(parsed) || parsed <= 0) {
            throw new Error("Enter a valid payment amount, or leave blank to use the plan price.");
          }
          body.amount = parsed;
        }
      }

      return grantAdminPremium(body);
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "business-info"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "premium-expiration"] });
      onClose();
      onSuccess?.();
      await alert.success(result.message, "Premium activated");
    },
    onError: (error: unknown) => {
      showError(error instanceof Error ? error.message : "Could not move business to premium.");
    },
  });

  if (!open || !business) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-to-premium-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex size-10 items-center justify-center rounded-xl bg-red-50 text-brand-red">
              <Crown className="size-5" aria-hidden />
            </span>
            <div>
              <h2 id="move-to-premium-title" className="text-lg font-semibold text-gray-900">
                Move to Premium
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Manually activate premium for{" "}
                <span className="font-semibold text-gray-900">{business.name}</span>
                {business.vendorName ? (
                  <>
                    {" "}
                    ({business.vendorName}
                    {business.vendorEmail ? ` · ${business.vendorEmail}` : ""})
                  </>
                ) : null}
                .
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Payment handling
            </legend>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-3 transition-colors hover:bg-gray-50 has-[:checked]:border-brand-red/40 has-[:checked]:bg-red-50/40">
              <input
                type="radio"
                name="payment_handling"
                className="mt-1"
                checked={paymentHandling === "recorded"}
                onChange={() => setPaymentHandling("recorded")}
              />
              <span>
                <span className="block text-sm font-medium text-gray-900">Record payment received</span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  Vendor paid outside the app (e.g. bank transfer). Creates a completed payment on the
                  Payments page.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-3 transition-colors hover:bg-gray-50 has-[:checked]:border-brand-red/40 has-[:checked]:bg-red-50/40">
              <input
                type="radio"
                name="payment_handling"
                className="mt-1"
                checked={paymentHandling === "waived"}
                onChange={() => setPaymentHandling("waived")}
              />
              <span>
                <span className="block text-sm font-medium text-gray-900">Payment waived</span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  No charge — for internal pages (e.g. Gidira) or advocates. Still logged on Payments as
                  waived.
                </span>
              </span>
            </label>
          </fieldset>

          {paymentHandling === "recorded" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5 sm:col-span-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Payment method
                </span>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as GrantPremiumPaymentMethod)}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-gray-400"
                >
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="block space-y-1.5 sm:col-span-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Amount (optional)
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Plan price if blank"
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-gray-400"
                />
              </label>
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Payment reference (optional)
                </span>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Bank transfer / receipt reference"
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-gray-400"
                />
              </label>
            </div>
          ) : null}

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Plan</span>
            <select
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-gray-400"
            >
              {PACKAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Duration is fixed: <span className="font-medium text-gray-700">{selectedPackage.days} days</span>{" "}
              (cannot be changed).
            </p>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Reason <span className="text-brand-red">*</span>
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Bank transfer confirmed / Advocate — fee waived / Internal Gidira page"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-gray-400"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !reason.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white hover:bg-brand-red/90 disabled:opacity-60"
          >
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Crown className="size-4" aria-hidden />}
            {mutation.isPending ? "Activating…" : "Activate premium"}
          </button>
        </div>
      </div>
    </div>
  );
}
