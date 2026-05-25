import { CreditCard, Info, X } from "lucide-react";

type PayoutMethod = {
  id: string;
  bankName: string;
  last4: string;
  isPrimary: boolean;
};

export default function SetPrimaryModal({
  open,
  onClose,
  method,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  method: PayoutMethod | null;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border-light px-5 py-4">
          <h2 className="text-base font-semibold text-ink">Set Primary Payout Method</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-body-secondary hover:bg-muted hover:text-ink"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex items-start gap-3 rounded-xl border border-border-light bg-muted/40 p-3">
            <CreditCard className="mt-0.5 size-4 text-chat-accent" />
            <div>
              <p className="text-sm font-medium text-ink">
                {method ? `${method.bankName} •••• ${method.last4}` : "No payout method selected"}
              </p>
              <p className="mt-1 text-xs text-body-secondary">
                This method will receive future payouts by default.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-body-secondary">
            <Info className="mt-0.5 size-3.5" />
            <p>You can change the primary method again at any time.</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border-light px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border-gray px-4 py-2 text-sm font-medium text-body-secondary hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white hover:bg-brand-red/90"
          >
            Set as Primary
          </button>
        </div>
      </div>
    </div>
  );
}