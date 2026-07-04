import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { alert, showError, showSuccess } from "@/lib/sweetAlert";

import { FlagVerificationModal } from "@/components/Modal/FlagVerificationModal";
import {
  adminAddVerificationNote,
  adminApproveVerification,
  adminDeleteVerification,
  adminFlagVerification,
  adminGrantReverification,
  adminReapproveVerification,
  adminReviewDocument,
  adminViewVerification,
  type AdminVerificationDetail,
  type AdminVerificationDocument,
} from "@/features/verification/adminVerificationApi";
import { groupDocumentsByType, getApproveAllBlockReason, type NestedDocFile } from "@/features/verification/verificationDocuments";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { formatNaira } from "@/lib/currency";
import { getLaravelErrorMessage } from "@/lib/laravelApiError";
import { cn } from "@/lib/utils";

const interactiveBtn =
  "cursor-pointer transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50";
const linkBtn =
  "cursor-pointer transition-colors duration-150 hover:text-sky-700 hover:underline";

function docStatusClass(status: string) {
  if (status === "approved") return "bg-green-100 text-green-700";
  if (status === "rejected") return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
}

type DocumentGroup = ReturnType<typeof groupDocumentsByType<AdminVerificationDocument>>[number];

function AdminDocumentFileItem({
  doc,
  acting,
  depth,
  onApprove,
  onReject,
}: {
  doc: NestedDocFile<AdminVerificationDocument>;
  acting: boolean;
  depth: number;
  onApprove: (doc: AdminVerificationDocument) => void;
  onReject: (doc: AdminVerificationDocument) => void;
}) {
  const fileUrl = doc.file_url ? resolveMediaUrl(doc.file_url) : null;

  return (
    <li className={depth > 0 ? "ml-4 border-l-2 border-border-light pl-3" : undefined}>
      <div
        className={`rounded-lg border border-border-light/80 p-3 ${depth > 0 ? "bg-card" : "bg-muted/20"}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">
              {depth > 0 ? "↳ Replacement: " : ""}
              {doc.file_name}
            </p>
            <span
              className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${docStatusClass(doc.status)}`}
            >
              {doc.status}
            </span>
            {doc.rejection_reason ? (
              <p className="mt-2 text-sm text-red-600">{doc.rejection_reason}</p>
            ) : null}
          </div>
          {fileUrl ? (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "inline-flex shrink-0 items-center gap-1 text-sm font-medium text-sky-600",
                linkBtn,
              )}
            >
              View file
              <ExternalLink className="size-3.5" />
            </a>
          ) : null}
        </div>
        {doc.status === "pending" ? (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={acting}
              onClick={() => onApprove(doc)}
              className={cn(
                interactiveBtn,
                "rounded-md bg-success px-3 py-1.5 text-xs font-semibold text-white hover:bg-success/90",
              )}
            >
              Accept
            </button>
            <button
              type="button"
              disabled={acting}
              onClick={() => onReject(doc)}
              className={cn(
                interactiveBtn,
                "rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100",
              )}
            >
              Reject
            </button>
          </div>
        ) : null}
      </div>
      {doc.children.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {doc.children.map((child) => (
            <AdminDocumentFileItem
              key={child.id}
              doc={child}
              depth={depth + 1}
              acting={acting}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function GroupedDocumentCard({
  group,
  acting,
  onApprove,
  onReject,
}: {
  group: DocumentGroup;
  acting: boolean;
  onApprove: (doc: AdminVerificationDocument) => void;
  onReject: (doc: AdminVerificationDocument) => void;
}) {
  const totalFiles = group.items.reduce(
    (count, item) => count + 1 + item.children.length,
    0,
  );

  return (
    <article className="rounded-xl border border-border-light p-4">
      <div className="mb-3 border-b border-border-light pb-3">
        <p className="font-semibold text-ink">{group.label}</p>
        <p className="text-xs text-body-secondary">
          {totalFiles} file{totalFiles === 1 ? "" : "s"} uploaded
        </p>
      </div>

      <ul className="space-y-3">
        {group.items.map((doc) => (
          <AdminDocumentFileItem
            key={doc.id}
            doc={doc}
            depth={0}
            acting={acting}
            onApprove={onApprove}
            onReject={onReject}
          />
        ))}
      </ul>
    </article>
  );
}

export default function AdminVerificationDetail() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const id = Number(businessId);

  const [detail, setDetail] = useState<AdminVerificationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [flagOpen, setFlagOpen] = useState(false);
  const [requestInfoNote, setRequestInfoNote] = useState("");
  const [rejectDoc, setRejectDoc] = useState<AdminVerificationDocument | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [reverifyReason, setReverifyReason] = useState(
    "Free re-verification after business profile update by admin.",
  );
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    try {
      setDetail(await adminViewVerification(id));
    } catch (error) {
      showError(getLaravelErrorMessage(error, "Could not load verification details."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const documentGroups = useMemo(
    () => groupDocumentsByType(detail?.documents ?? []),
    [detail?.documents],
  );

  const handleApproveBusiness = async () => {
    if (!detail) return;
    setActing(true);
    try {
      await adminApproveVerification(detail.id);
      showSuccess("All documents and business verification approved.");
      await load();
    } catch (error) {
      showError(getLaravelErrorMessage(error, "Could not approve."));
    } finally {
      setActing(false);
    }
  };

  const handleReapprove = async () => {
    if (!detail) return;
    setActing(true);
    try {
      await adminReapproveVerification(
        detail.id,
        "Verification re-approved after business profile update.",
      );
      showSuccess("Verification badge restored.");
      await load();
    } catch (error) {
      showError(getLaravelErrorMessage(error, "Could not re-approve verification."));
    } finally {
      setActing(false);
    }
  };

  const handleGrantReverification = async () => {
    if (!detail || reverifyReason.trim().length < 3) return;
    setActing(true);
    try {
      await adminGrantReverification(detail.id, reverifyReason.trim());
      showSuccess("Free re-verification granted. Vendor can upload documents again.");
      await load();
    } catch (error) {
      showError(getLaravelErrorMessage(error, "Could not grant free re-verification."));
    } finally {
      setActing(false);
    }
  };

  const handleDeleteVerification = async () => {
    if (!detail) return;
    const confirmed = await alert.confirmDelete(
      `verification for "${detail.business_name}"`,
      "The vendor will no longer be verified and can submit verification again.",
    );
    if (!confirmed) return;

    setActing(true);
    try {
      await adminDeleteVerification(detail.id);
      showSuccess("Verification removed. Vendor is no longer verified.");
      await load();
    } catch (error) {
      showError(getLaravelErrorMessage(error, "Could not remove verification."));
    } finally {
      setActing(false);
    }
  };

  const handleFlagBusiness = async (reason: string) => {
    if (!detail) return;
    setActing(true);
    try {
      await adminFlagVerification(detail.id, reason);
      showSuccess("Business flagged.");
      setFlagOpen(false);
      await load();
    } catch (error) {
      showError(getLaravelErrorMessage(error, "Could not flag."));
    } finally {
      setActing(false);
    }
  };

  const handleDocAction = async (doc: AdminVerificationDocument, action: "approve" | "reject") => {
    if (action === "reject") {
      setRejectDoc(doc);
      return;
    }
    setActing(true);
    try {
      await adminReviewDocument(doc.id, "approve");
      showSuccess(`"${doc.title}" approved.`);
      await load();
    } catch (error) {
      showError(getLaravelErrorMessage(error, "Could not update document."));
    } finally {
      setActing(false);
    }
  };

  const confirmRejectDoc = async () => {
    if (!rejectDoc || rejectReason.trim().length < 3) return;
    setActing(true);
    try {
      await adminReviewDocument(rejectDoc.id, "reject", rejectReason.trim());
      showSuccess(`"${rejectDoc.title}" rejected.`);
      setRejectDoc(null);
      setRejectReason("");
      await load();
    } catch (error) {
      showError(getLaravelErrorMessage(error, "Could not reject document."));
    } finally {
      setActing(false);
    }
  };

  const submitRequestInfo = async () => {
    if (!detail || requestInfoNote.trim().length < 3) return;
    setActing(true);
    try {
      await adminAddVerificationNote(detail.id, requestInfoNote.trim(), true);
      showSuccess("Request sent to vendor.");
      setRequestInfoNote("");
      await load();
    } catch (error) {
      showError(getLaravelErrorMessage(error, "Could not send request."));
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-body-secondary">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-6">
        <p>Verification not found.</p>
        <Link
          to="/admin/verifications"
          className={cn(linkBtn, "text-sky-600 no-underline hover:underline")}
        >
          Back to list
        </Link>
      </div>
    );
  }

  const hasPendingDocuments = (detail.documents ?? []).some((d) => d.status === "pending");
  const hasOpenDocumentReview = detail.has_open_document_review === true;
  const canReviewBusiness =
    !detail.is_flagged &&
    (detail.verification_status === "pending" ||
      (detail.verification_status === "approved" && hasPendingDocuments) ||
      (detail.verification_status === "none" && hasOpenDocumentReview));
  const approveAllBlockReason =
    getApproveAllBlockReason(detail.documents ?? []) ?? detail.approve_all_block_reason ?? null;
  const canApproveAll = canReviewBusiness && approveAllBlockReason === null;

  const hasPriorVerificationHistory =
    (detail.payments?.length ?? 0) > 0 || (detail.documents?.length ?? 0) > 0;

  const canDeleteVerification =
    detail.verification_status === "approved" ||
    detail.verification_status === "pending" ||
    detail.is_flagged ||
    hasOpenDocumentReview ||
    hasPriorVerificationHistory;

  const hasUnconsumedPayment =
    detail.has_unused_verification_payment === true ||
    detail.payments?.some((payment) => payment.status === "completed" && !payment.is_consumed);

  const allDocsApproved =
    getApproveAllBlockReason(detail.documents ?? []) === null &&
    (detail.documents?.length ?? 0) > 0;

  const canGrantReverification =
    !detail.is_flagged &&
    detail.verification_status === "none" &&
    hasPriorVerificationHistory &&
    !hasUnconsumedPayment &&
    !allDocsApproved;

  const canReapprove =
    !detail.is_flagged &&
    detail.verification_status === "none" &&
    (detail.needs_admin_reapproval === true || allDocsApproved);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/admin/verifications")}
          className={cn(
            interactiveBtn,
            "inline-flex items-center gap-2 text-sm font-medium text-body-secondary hover:text-ink",
          )}
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
        <h1 className="text-2xl font-semibold text-ink-heading">{detail.business_name}</h1>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${docStatusClass(
            detail.is_flagged ? "rejected" : detail.verification_status === "approved" ? "approved" : "pending",
          )}`}
        >
          {detail.verification_status_label}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="space-y-4 rounded-2xl border border-border-gray bg-card p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-chat-meta">Business & vendor</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-body-secondary">Category</dt>
              <dd className="font-medium">{detail.category?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-body-secondary">Vendor</dt>
              <dd className="font-medium">{detail.vendor?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-body-secondary">Email</dt>
              <dd>{detail.vendor?.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-body-secondary">Phone</dt>
              <dd>{detail.vendor?.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-body-secondary">Submitted</dt>
              <dd>{detail.created_at}</dd>
            </div>
          </dl>

          {detail.payments && detail.payments.length > 0 ? (
            <div className="border-t border-border-light pt-4">
              <h3 className="mb-2 text-xs font-semibold uppercase text-chat-meta">Payment</h3>
              {detail.payments.map((p) => (
                <p key={p.id} className="text-sm">
                  {p.package_id} · {formatNaira(p.amount, { freeLabel: false })} ·{" "}
                  <span className="capitalize">{p.status}</span>
                </p>
              ))}
            </div>
          ) : null}

          {canGrantReverification || canReapprove || hasUnconsumedPayment ? (
            <div className="space-y-3 border-t border-border-light pt-4">
              <h3 className="text-xs font-semibold uppercase text-chat-meta">Re-verification</h3>
              {hasUnconsumedPayment ? (
                <p className="text-sm text-amber-800">
                  An unused verification payment is already on file. If documents are approved, use
                  Re-approve now. Otherwise wait for the vendor to upload documents.
                </p>
              ) : (
                <p className="text-sm text-body-secondary">
                  Use these after a business profile change removed the verified badge.
                </p>
              )}
              {canGrantReverification ? (
                <>
                  <textarea
                    value={reverifyReason}
                    onChange={(e) => setReverifyReason(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-border-gray px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    disabled={acting || reverifyReason.trim().length < 3}
                    onClick={() => void handleGrantReverification()}
                    className={cn(
                      interactiveBtn,
                      "w-full rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100",
                    )}
                  >
                    Grant free re-verification
                  </button>
                </>
              ) : null}
              {canReapprove ? (
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => void handleReapprove()}
                  className={cn(
                    interactiveBtn,
                    "w-full rounded-md bg-success px-3 py-2 text-xs font-semibold text-white hover:bg-success/90",
                  )}
                >
                  Re-approve now (no new payment)
                </button>
              ) : null}
            </div>
          ) : null}

          {(canReviewBusiness || canDeleteVerification) ? (
            <div className="flex flex-wrap gap-2 border-t border-border-light pt-4">
              {canReviewBusiness ? (
                <>
                  {approveAllBlockReason ? (
                    <p className="w-full text-xs text-red-700">{approveAllBlockReason}</p>
                  ) : null}
                  <button
                    type="button"
                    disabled={acting || !canApproveAll}
                    onClick={() => void handleApproveBusiness()}
                    className={cn(
                      interactiveBtn,
                      "rounded-md bg-success px-3 py-1.5 text-xs font-semibold text-white hover:bg-success/90",
                    )}
                  >
                    {detail.verification_status === "approved" && hasPendingDocuments
                      ? "Approve all documents"
                      : "Approve all"}
                  </button>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => setFlagOpen(true)}
                    className={cn(
                      interactiveBtn,
                      "rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600",
                    )}
                  >
                    Flag business
                  </button>
                </>
              ) : null}
              {canDeleteVerification ? (
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => void handleDeleteVerification()}
                  className={cn(
                    interactiveBtn,
                    "inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100",
                  )}
                >
                  <Trash2 className="size-3.5" />
                  Delete verification
                </button>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="space-y-4 rounded-2xl border border-border-gray bg-card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-chat-meta">
            Uploaded documents
          </h2>
          {!detail.documents?.length ? (
            <p className="text-sm text-body-secondary">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-4">
              {documentGroups.map((group) => (
                <GroupedDocumentCard
                  key={group.documentType}
                  group={group}
                  acting={acting}
                  onApprove={(doc) => void handleDocAction(doc, "approve")}
                  onReject={(doc) => handleDocAction(doc, "reject")}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-border-gray bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-chat-meta">
          Request info from vendor
        </h2>
        <textarea
          value={requestInfoNote}
          onChange={(e) => setRequestInfoNote(e.target.value)}
          rows={3}
          placeholder="Ask the vendor to upload clearer documents or provide missing information..."
          className="w-full rounded-xl border border-border-gray px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={acting || requestInfoNote.trim().length < 3}
          onClick={() => void submitRequestInfo()}
          className={cn(
            interactiveBtn,
            "mt-3 rounded-md border border-border-gray bg-muted px-4 py-2 text-sm font-semibold hover:bg-muted/80",
          )}
        >
          Send request to vendor
        </button>

        {detail.notes && detail.notes.length > 0 ? (
          <div className="mt-6 space-y-2 border-t border-border-light pt-4">
            <h3 className="text-xs font-semibold uppercase text-chat-meta">Notes</h3>
            {detail.notes.map((n) => (
              <div key={n.id} className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <p>{n.note}</p>
                <p className="mt-1 text-xs text-body-secondary">
                  {n.created_at}
                  {n.is_visible_to_vendor ? " · visible to vendor" : " · internal"}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <FlagVerificationModal
        open={flagOpen}
        businessName={detail.business_name}
        onClose={() => setFlagOpen(false)}
        onConfirm={handleFlagBusiness}
      />

      {rejectDoc ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Reject document</h3>
            <p className="mt-1 text-sm text-body-secondary">{rejectDoc.title}</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="mt-4 w-full rounded-xl border px-3 py-2 text-sm"
              placeholder="Reason for rejection..."
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectDoc(null);
                  setRejectReason("");
                }}
                className={cn(
                  interactiveBtn,
                  "flex-1 rounded-xl border py-2 text-sm font-semibold hover:bg-muted",
                )}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rejectReason.trim().length < 3 || acting}
                onClick={() => void confirmRejectDoc()}
                className={cn(
                  interactiveBtn,
                  "flex-1 rounded-xl bg-red-500 py-2 text-sm font-semibold text-white hover:bg-red-600",
                )}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
