import { ArrowRight, FileUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  primeVerificationDocumentSession,
  type VerificationStatusPayload,
} from "@/features/verification/vendorVerificationApi";

import type { PlanId } from "./verificationData";

const PLAN_STORAGE_KEY = "verificationPlanId";

export function ProcessSummarySection({
  packageId,
  awaitingDocumentSubmission = false,
  verificationStatus = null,
  canInitPayment = true,
}: {
  packageId: PlanId;
  awaitingDocumentSubmission?: boolean;
  verificationStatus?: VerificationStatusPayload | null;
  canInitPayment?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <div className="relative col-span-12 flex flex-col space-y-4 rounded-2xl bg-black p-4 sm:p-6 lg:p-8 xl:col-span-4">
      <h3 className="font-inter text-base font-bold text-[#F8F9FF99] sm:text-lg">Process summary</h3>

      <div className="space-y-3">
        <p className="w-full text-sm text-[#F8F9FF] sm:w-[200px] sm:text-base">
          {awaitingDocumentSubmission ? (
            "Your payment is complete. Upload and submit your documents to begin review."
          ) : (
            <>
              Most verifications are completed within{" "}
              <span className="font-bold text-brand-red">24 to 48 hours</span> after submission.
            </>
          )}
        </p>
      </div>

      <div className="mt-auto">
        {awaitingDocumentSubmission ? (
          <Button
            type="button"
            className="w-full bg-brand-red px-4 py-2.5 text-sm text-white hover:bg-brand-red/90 sm:py-3 sm:px-6 sm:text-base"
            onClick={() => {
              if (verificationStatus) {
                primeVerificationDocumentSession(verificationStatus);
              } else {
                sessionStorage.setItem("paymentSource", "verification");
                sessionStorage.setItem(PLAN_STORAGE_KEY, packageId);
              }
              navigate("/vendor/document-upload");
            }}
          >
            <FileUp className="mr-2 h-4 w-4" />
            <span>Go to document upload</span>
          </Button>
        ) : canInitPayment ? (
          <Button
            className="w-full bg-brand-red px-4 py-2.5 text-sm text-white hover:bg-brand-red/90 sm:py-3 sm:px-6 sm:text-base"
            onClick={() => {
              sessionStorage.setItem("paymentSource", "verification");
              sessionStorage.setItem(PLAN_STORAGE_KEY, packageId);
              navigate("/vendor/review-pay");
            }}
          >
            <span>Continue to payment</span>
            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        ) : (
          <p className="text-sm text-[#F8F9FF]/90">
            {verificationStatus?.payment_block_reason ??
              "Payment is not required right now. Follow the status message above."}
          </p>
        )}
      </div>
    </div>
  );
}
