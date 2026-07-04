import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { AdminPaymentGateway, AdminPaymentListItem } from "@/features/payments/adminPaymentsApi";
import {
  applyAdminPayment,
  fetchAdminPaymentDetail,
  grantAdminPremium,
  type AdminPaymentDetail,
} from "@/features/payments/adminPaymentsApi";
import { formatNaira } from "@/lib/currency";
import { getLaravelErrorMessage } from "@/lib/laravelApiError";
import { showError, showSuccess } from "@/lib/sweetAlert";

import type { PaymentMethod, PaymentStatus } from "./PaymentDetailsModal.types";

type PaymentDetailsModalProps = {
  open: boolean;
  onClose: () => void;
  payment: AdminPaymentListItem | null;
};

function methodLabel(method: PaymentMethod) {
  if (method === "card") return "Card";
  if (method === "bank_transfer") return "Bank transfer";
  return "Wallet";
}

function statusLabel(status: PaymentStatus) {
  if (status === "completed") return "Completed";
  if (status === "pending") return "Pending";
  return "Failed";
}

function applyOutcomeLabel(type: AdminPaymentListItem["transactionType"]) {
  if (type === "subscription") return "activate premium";
  if (type === "verification") return "unlock document upload";
  if (type === "wallet_top_up") return "credit wallet balance";
  return "queue boost for admin approval";
}

function transactionTypeLabel(type: AdminPaymentListItem["transactionType"]): string {
  if (type === "wallet_top_up") return "Wallet top-up";
  if (type === "subscription") return "Subscription";
  if (type === "boost") return "Boost";
  if (type === "verification") return "Verification";
  return type;
}

export function PaymentDetailsModal({ open, onClose, payment }: PaymentDetailsModalProps) {
  const queryClient = useQueryClient();
  const [gateway, setGateway] = useState<AdminPaymentGateway>("paystack");
  const [gatewayTransactionId, setGatewayTransactionId] = useState("");
  const [applyReason, setApplyReason] = useState("Payment verified manually by admin");
  const [grantReason, setGrantReason] = useState("Paystack payment verified manually");

  const detailQuery = useQuery({
    queryKey: ["admin", "payments", "detail", payment?.id],
    queryFn: () => fetchAdminPaymentDetail(payment!.id),
    enabled: open && payment !== null,
  });

  const detail: AdminPaymentDetail | null = detailQuery.data ?? null;

  useEffect(() => {
    if (!open || !detail) return;
    setGatewayTransactionId(detail.gatewayTransactionId || "");
  }, [open, detail]);

  const applyMutation = useMutation({
    mutationFn: () =>
      applyAdminPayment(payment!.id, {
        gateway,
        gateway_transaction_id: gatewayTransactionId.trim(),
        reason: applyReason.trim() || undefined,
        verify_with_gateway: gateway === "paystack",
      }),
    onSuccess: (result) => {
      showSuccess(result.message || "Payment applied.");
      void queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      onClose();
    },
    onError: (error) => {
      showError(getLaravelErrorMessage(error, "Could not apply payment."));
    },
  });

  const grantMutation = useMutation({
    mutationFn: () =>
      grantAdminPremium({
        business_id: detail!.businessId!,
        reason: grantReason.trim(),
      }),
    onSuccess: (result) => {
      showSuccess(result.message || "Premium granted.");
      void queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      onClose();
    },
    onError: (error) => {
      showError(getLaravelErrorMessage(error, "Could not grant premium."));
    },
  });

  if (!open || !payment) return null;

  const showApplyGateway = payment.status === "pending";

  const showManualGrant =
    detail?.businessId &&
    payment.transactionType === "subscription" &&
    (payment.status === "pending" || (detail && !detail.isConsumed));

  const rows: { label: string; value: string }[] = [
    { label: "Business", value: payment.business },
    { label: "Payer", value: payment.payerName },
    { label: "Email", value: payment.payerEmail || "—" },
    { label: "Checkout reference", value: detail?.txRef || payment.reference },
    { label: "Gateway transaction ID", value: detail?.gatewayTransactionId || "—" },
    { label: "Amount", value: formatNaira(payment.amountNgn, { freeLabel: false }) },
    { label: "Type", value: transactionTypeLabel(payment.transactionType) },
    { label: "Method", value: methodLabel(payment.method) },
    { label: "Status", value: statusLabel(payment.status) },
    { label: "Date", value: payment.dateTimeLong || payment.dateShort || "—" },
  ];

  const busy = applyMutation.isPending || grantMutation.isPending;
  const reasonRequired = gateway === "flutterwave";
  const canApply =
    gatewayTransactionId.trim() !== "" && (!reasonRequired || applyReason.trim() !== "");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-card shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-details-title"
      >
        <PaymentDetailsModalHeader onClose={onClose} />
        <div className="flex max-h-[80vh] flex-col gap-4 overflow-y-auto px-6 pb-6 pt-6">
          {detailQuery.isLoading ? (
            <div className="flex items-center justify-center py-8 text-chat-meta">
              <Loader2 className="mr-2 size-5 animate-spin" />
              Loading payment details…
            </div>
          ) : (
            <>
              {rows.map((row) => (
                <div key={row.label} className="space-y-0.5">
                  <p className="text-sm font-semibold text-body-secondary">{row.label}</p>
                  <p className="break-all text-base font-normal leading-6 text-ink">{row.value}</p>
                </div>
              ))}

              {showApplyGateway ? (
                <div className="mt-2 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">Apply gateway payment</p>
                  <p className="text-sm text-amber-800">
                    Customer paid on Paystack or Flutterwave but checkout is still pending. Enter the
                    gateway transaction reference to {applyOutcomeLabel(payment.transactionType)}.
                  </p>
                  {detail?.txRef ? (
                    <p className="text-xs text-amber-800">
                      Checkout reference: <code className="font-mono">{detail.txRef}</code>
                    </p>
                  ) : null}
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-amber-900">Payment gateway</span>
                    <select
                      value={gateway}
                      onChange={(e) => setGateway(e.target.value as AdminPaymentGateway)}
                      className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="paystack">Paystack</option>
                      <option value="flutterwave">Flutterwave</option>
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-amber-900">Gateway transaction ID</span>
                    <input
                      type="text"
                      value={gatewayTransactionId}
                      onChange={(e) => setGatewayTransactionId(e.target.value)}
                      className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"
                      placeholder={
                        gateway === "paystack"
                          ? "subscription_123_abc..."
                          : "FLW-REF-12345"
                      }
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-amber-900">
                      Reason{reasonRequired ? "" : " (optional)"}
                    </span>
                    <textarea
                      value={applyReason}
                      onChange={(e) => setApplyReason(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={busy || !canApply}
                    onClick={() => applyMutation.mutate()}
                    className="inline-flex w-full items-center justify-center rounded-lg bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
                  >
                    {applyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Applying…
                      </>
                    ) : (
                      "Apply payment"
                    )}
                  </button>
                </div>
              ) : null}

              {showManualGrant ? (
                <div className="space-y-3 rounded-xl border border-chat-border-subtle bg-muted/30 p-4">
                  <p className="text-sm font-semibold text-ink-heading">Manual premium grant</p>
                  <p className="text-sm text-chat-meta">
                    Use this when the gateway cannot be verified (e.g. test/live key mismatch) but you
                    confirmed payment offline. This completes the pending checkout and activates premium.
                  </p>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-body-secondary">Reason</span>
                    <textarea
                      value={grantReason}
                      onChange={(e) => setGrantReason(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-chat-border-subtle bg-card px-3 py-2 text-sm"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={busy || grantReason.trim() === ""}
                    onClick={() => grantMutation.mutate()}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-chat-border-subtle bg-card px-4 py-2.5 text-sm font-semibold text-ink hover:bg-muted disabled:opacity-60"
                  >
                    {grantMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Granting…
                      </>
                    ) : (
                      "Grant premium manually"
                    )}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentDetailsModalHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-[61px] items-center justify-between border-b border-border-gray px-6">
      <h2 id="payment-details-title" className="text-lg font-semibold leading-7 text-ink-heading">
        Payment Details
      </h2>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex size-5 items-center justify-center text-body-secondary hover:text-ink"
        aria-label="Close"
      >
        <X className="size-5" strokeWidth={2} />
      </button>
    </div>
  );
}
