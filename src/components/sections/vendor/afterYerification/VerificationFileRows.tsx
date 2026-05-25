import type { ChangeEvent } from "react";
import { Upload } from "lucide-react";

import type { DocumentUiStatus } from "@/features/verification/verificationDocuments";

export type VerificationFileRow = {
  id: number;
  fileName: string;
  fileUrl: string | null;
  status: DocumentUiStatus;
  rejectionReason: string | null;
  children: VerificationFileRow[];
};

function statusBadge(status: DocumentUiStatus) {
  if (status === "missing") {
    return (
      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">MISSING</span>
    );
  }
  if (status === "approved") {
    return (
      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
        APPROVED
      </span>
    );
  }
  if (status === "flagged") {
    return (
      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">FLAGGED</span>
    );
  }
  return (
    <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
      IN REVIEW
    </span>
  );
}

type VerificationFileRowsProps = {
  files: VerificationFileRow[];
  depth?: number;
  uploadInputKey: (fileId?: number) => string;
  uploadingKey: string | null;
  onView: (file: VerificationFileRow) => void;
  onUpload: (fileId?: number) => void;
  registerInput: (fileId: number | undefined, el: HTMLInputElement | null) => void;
  onFileSelected: (fileId: number | undefined, event: ChangeEvent<HTMLInputElement>) => void;
};

export function VerificationFileRows({
  files,
  depth = 0,
  uploadInputKey,
  uploadingKey,
  onView,
  onUpload,
  registerInput,
  onFileSelected,
}: VerificationFileRowsProps) {
  return (
    <ul className={depth === 0 ? "mt-3 space-y-2" : "mt-2 space-y-2 border-l-2 border-border-light pl-3"}>
      {files.map((file) => (
        <li key={file.id}>
          <div
            className={`flex flex-wrap items-center justify-between gap-2 rounded-md border border-border-light/80 bg-muted/20 px-2 py-1.5 ${depth > 0 ? "bg-card" : ""}`}
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-ink">
                {depth > 0 ? "↳ Replacement: " : ""}
                {file.fileName}
              </p>
              {file.rejectionReason ? (
                <p className="text-xs text-red-600">{file.rejectionReason}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {statusBadge(file.status)}
              {file.fileUrl ? (
                <button
                  type="button"
                  onClick={() => onView(file)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  View
                </button>
              ) : null}
              {file.status === "flagged" ? (
                <button
                  type="button"
                  disabled={uploadingKey === uploadInputKey(file.id)}
                  onClick={() => onUpload(file.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-primary px-2 py-1 text-xs font-medium text-primary hover:bg-primary/5 disabled:opacity-50"
                >
                  <Upload className="h-3 w-3" />
                  {uploadingKey === uploadInputKey(file.id) ? "Uploading..." : "Upload"}
                </button>
              ) : null}
            </div>
          </div>
          <input
            ref={(el) => registerInput(file.id, el)}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => onFileSelected(file.id, e)}
          />
          {file.children.length > 0 ? (
            <VerificationFileRows
              files={file.children}
              depth={depth + 1}
              uploadInputKey={uploadInputKey}
              uploadingKey={uploadingKey}
              onView={onView}
              onUpload={onUpload}
              registerInput={registerInput}
              onFileSelected={onFileSelected}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
