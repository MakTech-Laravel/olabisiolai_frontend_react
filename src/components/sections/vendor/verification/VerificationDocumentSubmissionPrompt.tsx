import { FileUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  primeVerificationDocumentSession,
  type VerificationStatusPayload,
} from "@/features/verification/vendorVerificationApi";
import { formatNaira } from "@/lib/currency";

type Props = {
  status: VerificationStatusPayload | null;
};

export function VerificationDocumentSubmissionPrompt({ status }: Props) {
  const navigate = useNavigate();

  if (!status?.awaiting_document_submission) {
    return null;
  }

  const purchased = status.purchased_package;
  const planTitle = purchased?.title ?? "verification plan";
  const amountLabel =
    purchased?.amount != null ? formatNaira(purchased.amount, { freeLabel: false }) : null;

  const goToDocumentUpload = () => {
    primeVerificationDocumentSession(status);
    navigate("/vendor/document-upload");
  };

  return (
    <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5 md:p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-amber-950">
            Payment received — documents still required
          </p>
          <p className="text-sm leading-relaxed text-amber-900/90">
            You paid for the <span className="font-semibold">{planTitle}</span>
            {amountLabel ? <> ({amountLabel})</> : null}. Upload your documents and submit your
            application to start verification. If you skipped this step, use the button below to
            continue.
          </p>
          {purchased?.usage_message ? (
            <p className="text-xs text-amber-800/80">{purchased.usage_message}</p>
          ) : null}
        </div>

        <Button
          type="button"
          className="shrink-0 bg-brand-red px-6 text-white hover:bg-brand-red/90"
          onClick={goToDocumentUpload}
        >
          <FileUp className="mr-2 size-4" />
          Upload &amp; submit documents
        </Button>
      </div>
    </div>
  );
}
