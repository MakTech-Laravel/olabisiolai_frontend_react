import { X } from "lucide-react";

import type { AdminPaymentListItem } from "@/features/payments/adminPaymentsApi";
import { formatNaira } from "@/lib/currency";

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

export function PaymentDetailsModal({ open, onClose, payment }: PaymentDetailsModalProps) {
  if (!open || !payment) return null;

  const rows: { label: string; value: string }[] = [
    { label: "Business", value: payment.business },
    { label: "Payer", value: payment.payerName },
    { label: "Email", value: payment.payerEmail || "—" },
    { label: "Reference", value: payment.reference },
    { label: "Amount", value: formatNaira(payment.amountNgn, { freeLabel: false }) },
    { label: "Type", value: payment.transactionType },
    { label: "Method", value: methodLabel(payment.method) },
    { label: "Status", value: statusLabel(payment.status) },
    { label: "Date", value: payment.dateTimeLong || payment.dateShort || "—" },
  ];

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
          {rows.map((row) => (
            <div key={row.label} className="space-y-0.5">
              <p className="text-sm font-semibold text-body-secondary">{row.label}</p>
              <p className="break-all text-base font-normal leading-6 text-ink">{row.value}</p>
            </div>
          ))}
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
