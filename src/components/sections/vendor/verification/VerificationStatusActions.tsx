import { FileSearch } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import type { VerificationStatusPayload } from "@/features/verification/vendorVerificationApi";

export function VerificationStatusActions({
  status,
}: {
  status: VerificationStatusPayload | null;
}) {
  if (!status) return null;

  const hasDocuments = (status.documents?.length ?? 0) > 0;
  const hasSubmitted =
    hasDocuments ||
    status.verification_status === "pending" ||
    status.verification_status === "approved" ||
    status.is_flagged;

  if (!hasSubmitted) return null;

  const rejectedCount = status.documents?.filter((d) => d.status === "rejected").length ?? 0;
  const pendingCount = status.documents?.filter((d) => d.status === "pending").length ?? 0;
  const approvedCount = status.documents?.filter((d) => d.status === "approved").length ?? 0;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-gray bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">
          Application status: {status.verification_status_label}
        </p>
        {hasDocuments ? (
          <p className="text-xs text-body-secondary">
            {approvedCount > 0 ? `${approvedCount} approved` : null}
            {approvedCount > 0 && (pendingCount > 0 || rejectedCount > 0) ? " · " : null}
            {pendingCount > 0 ? `${pendingCount} in review` : null}
            {pendingCount > 0 && rejectedCount > 0 ? " · " : null}
            {rejectedCount > 0 ? `${rejectedCount} need action` : null}
          </p>
        ) : (
          <p className="text-xs text-body-secondary">
            View uploaded documents and admin feedback on your verification files.
          </p>
        )}
      </div>

      <Button
        asChild
        variant="outline"
        className="shrink-0 border-primary text-primary hover:bg-primary/5"
      >
        <Link to="/vendor/after-verification">
          <FileSearch className="mr-2 size-4" />
          View document status
        </Link>
      </Button>
    </div>
  );
}
