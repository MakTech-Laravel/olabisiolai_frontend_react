import { useState } from "react";
import { CreditCard, Lock, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { showError, showSuccess } from "@/lib/sweetAlert";
import { getLaravelErrorMessage } from "@/lib/laravelApiError";

import { applyForVerification } from "@/features/verification/vendorVerificationApi";
import {
  DOC_TITLE_TO_TYPE,
  REQUIRED_VERIFICATION_DOCUMENTS,
} from "@/features/verification/verificationDocuments";

export default function VerifyIdentity({
  uploadedFiles,
  paymentId,
}: {
  uploadedFiles: Record<string, File[]>;
  paymentId: number | null;
}) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!paymentId) {
      showError("Complete payment before submitting documents.");
      navigate("/vendor/verification");
      return;
    }

    const missingRequired = REQUIRED_VERIFICATION_DOCUMENTS.filter(
      (doc) => (uploadedFiles[doc.title] ?? []).length === 0,
    );
    if (missingRequired.length > 0) {
      showError(`Upload all required documents: ${missingRequired.map((doc) => doc.title).join(", ")}.`);
      return;
    }

    const documents = Object.entries(uploadedFiles).flatMap(([title, files]) =>
      files.map((file) => ({
        document_type: DOC_TITLE_TO_TYPE[title] ?? "other",
        title,
        file,
      })),
    );

    if (documents.length === 0) {
      showError("Upload at least one document.");
      return;
    }

    try {
      setSubmitting(true);
      await applyForVerification(paymentId, documents);
      sessionStorage.removeItem("verificationPaymentId");
      sessionStorage.removeItem("verificationPlanId");
      sessionStorage.removeItem("paymentSource");
      showSuccess("Verification request submitted.");
      navigate("/vendor/after-verification");
    } catch (error) {
      showError(getLaravelErrorMessage(error, "Could not submit verification request."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="space-y-6">
        <div className="rounded-2xl bg-[#1c1c1c] p-12">
          <h2 className="mb-5 text-xl font-bold text-white">Why verify your identity?</h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3 text-sm text-gray-300">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <span>
                <span className="font-semibold text-white">Consumer Confidence:</span> Verified
                vendors see more first-time customer conversions.
              </span>
            </li>
            <li className="flex items-start gap-3 text-sm text-gray-300">
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <span>
                <span className="font-semibold text-white">Enhanced Security:</span> Protect your
                account against unauthorized access.
              </span>
            </li>
            <li className="flex items-start gap-3 text-sm text-gray-300">
              <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <span>
                <span className="font-semibold text-white">Higher Limits:</span> Increase transaction
                volume and withdrawal caps.
              </span>
            </li>
          </ul>
        </div>
      </div>
      <div className="my-10 flex justify-center">
        <button
          type="button"
          disabled={submitting || !paymentId}
          onClick={() => void handleSubmit()}
          className="w-full rounded-lg bg-red-500 px-6 py-3 font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit verification request"}
        </button>
      </div>
    </div>
  );
}
