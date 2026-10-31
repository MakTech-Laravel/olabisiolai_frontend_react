import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { isBoostPaymentCheckout } from "@/features/boost/boostCheckoutSession";

type BoostPayHeaderProps = {
  variant?: "boost" | "subscription" | "verification";
  /** Subscription checkout: return to owner business listing instead of vendor dashboard. */
  backTo?: string;
};

export function BoostPayHeader({ variant = "boost", backTo }: BoostPayHeaderProps) {
  const navigate = useNavigate();
  const isSubscription = variant === "subscription";
  const isVerification = variant === "verification";

  return (
    <>
      <button
        type="button"
        onClick={() =>
          navigate(
            isSubscription
              ? (backTo ?? "/user/profile")
              : isVerification
                ? "/vendor/verification"
                : isBoostPaymentCheckout()
                  ? "/vendor/boost"
                  : "/vendor/boost/configure",
          )
        }
        className="inline-flex items-center gap-1 text-sm font-inter text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {isSubscription
          ? "Back to business profile"
          : isVerification
            ? "Back to verification"
            : "Back to Configure"}
      </button>

      <div className="space-y-1">
        <h2 className="text-4xl font-extrabold font-inter text-foreground">Review & Pay</h2>
        <p className="text-base font-inter text-muted-foreground">
          {isSubscription
            ? "Complete payment to activate your premium plan. Verification is purchased separately."
            : isVerification
              ? "Complete payment to unlock document upload for business verification."
              : "Complete your transaction to activate your business visibility boost."}
        </p>
      </div>
    </>
  );
}
