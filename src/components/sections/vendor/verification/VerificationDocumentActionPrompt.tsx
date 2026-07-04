import { FileUp } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import type { VerificationStatusPayload } from "@/features/verification/vendorVerificationApi";

export function VerificationDocumentActionPrompt({
  status,
}: {
  status: VerificationStatusPayload | null;
}) {
  if (!status?.needs_document_action) {
    return null;
  }

  return (
    <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5 md:p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-amber-950">Replacement documents required</p>
          <p className="text-sm leading-relaxed text-amber-900/90">
            An admin rejected one or more verification files. Upload replacements on your document
            status page to continue review. You do not need to pay again.
          </p>
          {status.payment_block_reason ? (
            <p className="text-xs font-medium text-amber-800">{status.payment_block_reason}</p>
          ) : null}
        </div>

        <Button
          asChild
          className="shrink-0 bg-brand-red px-6 text-white hover:bg-brand-red/90"
        >
          <Link to="/vendor/after-verification">
            <FileUp className="mr-2 size-4" />
            Upload replacements
          </Link>
        </Button>
      </div>
    </div>
  );
}
