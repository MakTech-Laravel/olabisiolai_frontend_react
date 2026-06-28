import { Lock, PlugZap } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatNaira } from "@/lib/currency";

export function OrderSummaryCard({
  onConfirmPay,
  isPaying,
  planTitle = "Visibility Pro Plus",
  totalAmount = 5000,
  isVerification = false,
  boostLine,
  beforePayButton,
  confirmLabel,
}: {
  onConfirmPay?: () => void;
  isPaying?: boolean;
  confirmLabel?: string;
  planTitle?: string;
  totalAmount?: number;
  isVerification?: boolean;
  boostLine?: {
    label: string;
    amount: number;
    dailyBudget?: number;
    durationDays?: number;
  } | null;
  /** Optional slot for checkboxes / notices above Pay Now */
  beforePayButton?: ReactNode;
}) {
  const navigate = useNavigate();

  const formattedTotal = formatNaira(totalAmount, { freeLabel: false });

  const handleConfirmPay = () => {
    if (onConfirmPay) {
      onConfirmPay();
      return;
    }

    const cameFromVerification = sessionStorage.getItem("paymentSource") === "verification";
    sessionStorage.removeItem("paymentSource");

    if (cameFromVerification) {
      navigate("/vendor/document-upload");
    } else {
      navigate("/vendor/boost");
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <p className="text-2xl font-semibold">Order Summary</p>

        <div className="inline-flex items-center gap-3">
          <div className="rounded-md bg-brand-red p-2 text-success-foreground">
            <PlugZap className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {isVerification ? "Verification package" : "Plan selected"}
            </p>
            <p className="text-base font-semibold">{planTitle}</p>
          </div>
        </div>

        {boostLine && boostLine.amount > 0 ? (
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Boost add-on ({boostLine.label})</span>
              <span className="font-semibold text-foreground">
                {formatNaira(boostLine.amount, { freeLabel: false })}
              </span>
            </div>
            {boostLine.dailyBudget != null && boostLine.durationDays != null ? (
              <p className="text-xs">
                Daily budget: {formatNaira(boostLine.dailyBudget, { freeLabel: false })} ·{' '}
                {boostLine.durationDays} {boostLine.durationDays === 1 ? 'day' : 'days'}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-lg font-semibold">Total Price</span>
          <span className="text-4xl font-bold text-brand-red">{formattedTotal}</span>
        </div>

        {beforePayButton ? <div className="space-y-2">{beforePayButton}</div> : null}

        <Button
          className="w-full bg-brand-red text-white hover:bg-brand-red/90"
          onClick={handleConfirmPay}
          disabled={isPaying}
        >
          <Lock className="size-4" />
          {isPaying ? "Processing..." : (confirmLabel ?? "Pay Now")}
        </Button>

        <p className="text-center text-[10px] uppercase tracking-wide text-muted-foreground">
          SSL Encrypted & PCI-DSS Compliant
        </p>
      </CardContent>
    </Card>
  );
}
