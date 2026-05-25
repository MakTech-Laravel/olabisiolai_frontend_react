import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";

import { ProcessSummarySection } from "@/components/sections/vendor/verification/ProcessSummarySection";
import { PurchasedVerificationPlan } from "@/components/sections/vendor/verification/PurchasedVerificationPlan";
import { SelectedPlanNote } from "@/components/sections/vendor/verification/SelectedPlanNote";
import type { PlanId } from "@/components/sections/vendor/verification/verificationData";
import { VerificationDocumentSubmissionPrompt } from "@/components/sections/vendor/verification/VerificationDocumentSubmissionPrompt";
import { VerificationHeader } from "@/components/sections/vendor/verification/VerificationHeader";
import { VerificationPlansGrid } from "@/components/sections/vendor/verification/VerificationPlansGrid";
import { VerificationStatusActions } from "@/components/sections/vendor/verification/VerificationStatusActions";
import { WhyVerifySection } from "@/components/sections/vendor/verification/WhyVerifySection";
import { fetchVerificationStatus } from "@/features/verification/vendorVerificationApi";

const PLAN_STORAGE_KEY = "verificationPlanId";

export default function VendorVerification() {
  const location = useLocation();
  const [selectedId, setSelectedId] = useState<PlanId>(() => {
    const stored = sessionStorage.getItem(PLAN_STORAGE_KEY);
    if (stored === "individual" || stored === "business" || stored === "ltd") {
      return stored;
    }
    return "individual";
  });

  const { data: verificationStatus } = useQuery({
    queryKey: ["vendor", "verification", "status", location.key],
    queryFn: fetchVerificationStatus,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    sessionStorage.setItem(PLAN_STORAGE_KEY, selectedId);
  }, [selectedId]);

  useEffect(() => {
    const purchasedId = verificationStatus?.purchased_package?.id;
    if (purchasedId === "individual" || purchasedId === "business" || purchasedId === "ltd") {
      setSelectedId(purchasedId);
    }
  }, [verificationStatus?.purchased_package?.id]);

  const awaitingDocuments = verificationStatus?.awaiting_document_submission === true;

  return (
    <div className="p-4 md:p-6">
      <section className="text-foreground">
        <div className="space-y-8 md:space-y-10">
          <VerificationHeader />

          {verificationStatus?.purchased_package ? (
            <PurchasedVerificationPlan purchased={verificationStatus.purchased_package} />
          ) : null}

          <VerificationDocumentSubmissionPrompt status={verificationStatus ?? null} />

          <VerificationStatusActions status={verificationStatus ?? null} />

          {!awaitingDocuments ? (
            <div className="space-y-4">
              <VerificationPlansGrid selectedId={selectedId} onPlanSelect={setSelectedId} />
              <SelectedPlanNote
                selectedId={selectedId}
                purchasedPackage={verificationStatus?.purchased_package ?? null}
              />
            </div>
          ) : null}

          <div className="grid grid-cols-12 gap-8">
            <WhyVerifySection />
            <ProcessSummarySection
              packageId={selectedId}
              awaitingDocumentSubmission={awaitingDocuments}
              verificationStatus={verificationStatus ?? null}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

