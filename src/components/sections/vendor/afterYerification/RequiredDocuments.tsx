import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Loader2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { showError, showInfo, showSuccess } from "@/lib/sweetAlert";

import {
  VerificationFileRows,
  type VerificationFileRow,
} from "@/components/sections/vendor/afterYerification/VerificationFileRows";
import {
  fetchVerificationStatus,
  reuploadVerificationDocument,
  type VerificationStatusPayload,
} from "@/features/verification/vendorVerificationApi";
import {
  mapApiDocStatus,
  nestDocumentsByParent,
  REQUIRED_VERIFICATION_DOCUMENTS,
  type DocumentUiStatus,
  type NestedDocFile,
  type RequiredDocSpec,
} from "@/features/verification/verificationDocuments";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { cn } from "@/lib/utils";

type DocRow = RequiredDocSpec & {
  status: DocumentUiStatus;
  files: VerificationFileRow[];
};

function flattenFiles(files: VerificationFileRow[]): VerificationFileRow[] {
  return files.flatMap((file) => [file, ...flattenFiles(file.children)]);
}

function deriveCategoryStatus(files: VerificationFileRow[]): DocumentUiStatus {
  const flat = flattenFiles(files);
  if (flat.length === 0) return "missing";
  if (flat.some((f) => f.status === "flagged")) return "flagged";
  if (flat.every((f) => f.status === "approved")) return "approved";
  return "in_review";
}

function getStatusBadge(status: DocumentUiStatus) {
  switch (status) {
    case "missing":
      return (
        <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
          MISSING
        </span>
      );
    case "in_review":
      return (
        <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
          IN REVIEW
        </span>
      );
    case "approved":
      return (
        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
          APPROVED
        </span>
      );
    case "flagged":
      return (
        <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
          FLAGGED
        </span>
      );
  }
}

type ApiDoc = VerificationStatusPayload["documents"][number];

type ApiDocNode = {
  id: number;
  parent_document_id: number | null;
  fileName: string;
  fileUrl: string | null;
  status: DocumentUiStatus;
  rejectionReason: string | null;
};

function mapNestedNode(node: NestedDocFile<ApiDocNode>): VerificationFileRow {
  return {
    id: node.id,
    fileName: node.fileName,
    fileUrl: node.fileUrl,
    status: node.status,
    rejectionReason: node.rejectionReason,
    children: node.children.map((child) => mapNestedNode(child)),
  };
}

function buildRows(specs: RequiredDocSpec[], apiDocs: ApiDoc[]): DocRow[] {
  const byType = new Map<string, ApiDoc[]>();

  for (const doc of apiDocs) {
    const list = byType.get(doc.document_type) ?? [];
    list.push(doc);
    byType.set(doc.document_type, list);
  }

  return specs.map((spec) => {
    const nodes = (byType.get(spec.documentType) ?? []).map(
      (doc): ApiDocNode => ({
        id: doc.id,
        parent_document_id: doc.parent_document_id ?? null,
        fileName: doc.file_name,
        fileUrl: doc.file_url ? resolveMediaUrl(doc.file_url) : null,
        status: mapApiDocStatus(doc.status, true),
        rejectionReason: doc.rejection_reason ?? null,
      }),
    );

    const files = nestDocumentsByParent(nodes).map((node) => mapNestedNode(node));

    return {
      ...spec,
      files,
      status: deriveCategoryStatus(files),
    };
  });
}

function uploadInputKey(documentType: string, fileId?: number) {
  return fileId ? `${documentType}-${fileId}` : `${documentType}-new`;
}

export function RequiredDocuments({ className }: { className?: string }) {
  const navigate = useNavigate();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [statusPayload, setStatusPayload] = useState<VerificationStatusPayload | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStatusPayload(await fetchVerificationStatus());
    } catch {
      showError("Could not load verification documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(
    () => buildRows(REQUIRED_VERIFICATION_DOCUMENTS, statusPayload?.documents ?? []),
    [statusPayload?.documents],
  );

  const actionRequiredCount = useMemo(() => {
    let count = 0;
    for (const row of rows) {
      if (row.status === "missing") {
        count += 1;
        continue;
      }
      count += flattenFiles(row.files).filter((f) => f.status === "flagged").length;
    }
    return count;
  }, [rows]);

  const canInlineUpload =
    statusPayload?.verification_status === "pending" && !statusPayload.is_flagged;

  const triggerUpload = (row: DocRow, fileId?: number) => {
    if (canInlineUpload) {
      fileInputRefs.current[uploadInputKey(row.documentType, fileId)]?.click();
      return;
    }
    if (statusPayload?.is_flagged) {
      showInfo("Complete a new verification payment before uploading documents.");
      navigate("/vendor/verification");
      return;
    }
    navigate("/vendor/document-upload");
  };

  const handleFileSelected = async (
    row: DocRow,
    event: ChangeEvent<HTMLInputElement>,
    fileId?: number,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const key = uploadInputKey(row.documentType, fileId);
    setUploadingKey(key);
    try {
      await reuploadVerificationDocument({
        document_type: row.documentType,
        title: row.title,
        parent_document_id: fileId,
        file,
      });
      showSuccess("Document uploaded for review.");
      await load();
    } catch {
      showError("Could not upload document.");
    } finally {
      setUploadingKey(null);
    }
  };

  const handleView = (file: VerificationFileRow) => {
    if (!file.fileUrl) {
      showError("No file available to view.");
      return;
    }
    window.open(file.fileUrl, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className={cn("flex min-h-[200px] items-center justify-center", className)}>
        <Loader2 className="size-8 animate-spin text-body-secondary" />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="bg-card p-4 sm:p-6">
        {statusPayload?.is_flagged ? (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">Action required on your verification</p>
            <p className="mt-1 text-amber-800">
              An admin flagged your submission. Review notes below and re-submit documents after
              payment.
            </p>
          </div>
        ) : null}

        {statusPayload?.verification_status === "approved" ? (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <p className="font-semibold">Your business is verified</p>
            {statusPayload.verified_at ? (
              <p className="mt-1">Verified on {statusPayload.verified_at}</p>
            ) : null}
          </div>
        ) : statusPayload?.verification_status === "pending" && !statusPayload.is_flagged ? (
          <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            <p className="font-semibold">Verification pending review</p>
            <p className="mt-1">
              If a file is flagged, upload a replacement — it will appear nested under that file.
            </p>
          </div>
        ) : null}

        {statusPayload?.notes && statusPayload.notes.length > 0 ? (
          <div className="mb-4 space-y-2 rounded-lg border border-border-gray bg-muted/30 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">
              Messages from admin
            </p>
            {statusPayload.notes.map((note) => (
              <p key={note.id} className="text-sm text-ink">
                {note.note}
                <span className="mt-1 block text-xs text-body-secondary">{note.created_at}</span>
              </p>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:gap-4">
          <h2 className="text-lg font-semibold sm:text-xl">Required Documents</h2>
          {actionRequiredCount > 0 ? (
            <p className="rounded-full bg-[#FFD12766] px-3 py-1 text-base font-semibold sm:text-xl">
              {actionRequiredCount} ACTION REQUIRED
            </p>
          ) : (
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
              All documents submitted
            </span>
          )}
        </div>

        <div className="space-y-4">
          {rows.map((doc) => {
            const Icon = doc.icon;
            const showCategoryUpload = doc.status === "missing";

            return (
              <div key={doc.documentType} className="rounded-lg border p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-inter text-sm font-medium sm:text-base">{doc.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{doc.description}</p>
                    {doc.files.length > 0 ? (
                      <VerificationFileRows
                        files={doc.files}
                        uploadInputKey={(fileId) => uploadInputKey(doc.documentType, fileId)}
                        uploadingKey={uploadingKey}
                        onView={handleView}
                        onUpload={(fileId) => triggerUpload(doc, fileId)}
                        registerInput={(fileId, el) => {
                          fileInputRefs.current[uploadInputKey(doc.documentType, fileId)] = el;
                        }}
                        onFileSelected={(fileId, event) => void handleFileSelected(doc, event, fileId)}
                      />
                    ) : null}
                    {showCategoryUpload ? (
                      <input
                        ref={(el) => {
                          fileInputRefs.current[uploadInputKey(doc.documentType)] = el;
                        }}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => void handleFileSelected(doc, e)}
                      />
                    ) : null}
                  </div>

                  <div className="mt-2 flex flex-col items-start gap-2 sm:mt-0 sm:flex-row sm:items-center">
                    {getStatusBadge(doc.status)}

                    {showCategoryUpload ? (
                      <button
                        type="button"
                        disabled={uploadingKey === uploadInputKey(doc.documentType)}
                        onClick={() => triggerUpload(doc)}
                        className="flex items-center gap-2 rounded-md border border-primary px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/5 disabled:opacity-50"
                      >
                        <Upload className="h-3 w-3" />
                        {uploadingKey === uploadInputKey(doc.documentType) ? "Uploading..." : "Upload"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
