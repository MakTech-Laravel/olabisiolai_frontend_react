import type { VerificationStatusPayload } from "@/features/verification/vendorVerificationApi";

export function VerificationReapprovalPrompt({
  status,
}: {
  status: VerificationStatusPayload | null;
}) {
  if (!status?.needs_admin_reapproval) {
    return null;
  }

  return (
    <div className="rounded-xl border-2 border-sky-300 bg-sky-50 p-5 md:p-6 shadow-sm">
      <p className="text-sm font-semibold text-sky-950">Awaiting admin re-approval</p>
      <p className="mt-2 text-sm leading-relaxed text-sky-900/90">
        Your business profile was updated and your verification badge was reset. Your documents are
        still on file and an admin will re-approve your verification. You do not need to pay again.
      </p>
      {status.payment_block_reason ? (
        <p className="mt-2 text-xs font-medium text-sky-800">{status.payment_block_reason}</p>
      ) : null}
    </div>
  );
}
