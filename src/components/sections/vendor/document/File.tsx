import { UploadCloudIcon, X, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { showError } from "@/lib/sweetAlert";

type FileProps = {
  uploadedFiles: Record<string, File[]>;
  onFilesChange: (files: Record<string, File[]>) => void;
};

export default function File({ uploadedFiles, onFilesChange }: FileProps) {
  const [previewUrls, setPreviewUrls] = useState<Record<string, string[]>>({
    "Business Registration": [],
    "Identity Proof": [],
    "Address Proof": [],
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({
    "Business Registration": null,
    "Identity Proof": null,
    "Address Proof": null,
  });

  const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5120 KB (matches backend validation)
  const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

  function formatBytes(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  }

  function validatePickedFiles(title: string, picked: File[]): { accepted: File[]; rejectedMessage: string | null } {
    const rejected: string[] = [];
    const accepted: File[] = [];

    for (const file of picked) {
      const mimeOk = ALLOWED_MIME_TYPES.has(file.type);
      const sizeOk = file.size <= MAX_FILE_BYTES;

      if (!mimeOk) {
        rejected.push(`${file.name} (unsupported type)`);
        continue;
      }

      if (!sizeOk) {
        rejected.push(`${file.name} (${formatBytes(file.size)} > 5.0MB)`);
        continue;
      }

      accepted.push(file);
    }

    if (rejected.length === 0) return { accepted, rejectedMessage: null };
    const msg = `Some files were skipped for "${title}": ${rejected.join(", ")}. Max 5MB. PDF/JPG/PNG only.`;
    return { accepted, rejectedMessage: msg };
  }

  const handleFileUpload = (title: string, files: FileList | null) => {
    if (!files) return;

    const picked = Array.from(files);
    const { accepted: newFiles, rejectedMessage } = validatePickedFiles(title, picked);

    setFieldErrors((prev) => ({ ...prev, [title]: rejectedMessage }));
    if (rejectedMessage) {
      showError(rejectedMessage);
    }
    if (newFiles.length === 0) return;

    const newUrls = newFiles.map((file) =>
      file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
    );

    onFilesChange({
      ...uploadedFiles,
      [title]: [...(uploadedFiles[title] ?? []), ...newFiles],
    });

    setPreviewUrls((prev) => ({
      ...prev,
      [title]: [...(prev[title] ?? []), ...newUrls],
    }));
  };

  const removeFile = (title: string, index: number) => {
    if (previewUrls[title]?.[index]) {
      URL.revokeObjectURL(previewUrls[title][index]);
    }

    onFilesChange({
      ...uploadedFiles,
      [title]: (uploadedFiles[title] ?? []).filter((_, i) => i !== index),
    });

    setPreviewUrls((prev) => ({
      ...prev,
      [title]: (prev[title] ?? []).filter((_, i) => i !== index),
    }));
  };

  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach((urls) => {
        urls.forEach((url) => {
          if (url) URL.revokeObjectURL(url);
        });
      });
    };
  }, [previewUrls]);

  return (
    <div>
      <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-3">
        {[
          {
            title: "Business Registration",
            hint: "Trade license CAC incorporation document. PDF, JPG",
          },
          {
            title: "Identity Proof",
            hint: "Government-issued ID, Passport or Driver's License",
          },
          {
            title: "Address Proof",
            hint: "Utility bill or bank statement issued within 3 months",
          },
        ].map(({ title, hint }) => (
          <div key={title}>
            <p className="mb-2 text-xl font-medium text-gray-600">{title}</p>
            <div className="relative flex min-h-[150px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-blue-50/40 p-8 transition-colors hover:border-blue-400">
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={(e) => handleFileUpload(title, e.target.files)}
              />
              <UploadCloudIcon className="h-7 w-7 text-blue-500" />
              <span className="text-sm font-medium text-blue-500">Click to upload images</span>
              <span className="text-center text-xs leading-snug text-gray-400">{hint}</span>
              <span className="text-center text-[11px] text-gray-400">Max 5MB · PDF / JPG / PNG</span>
            </div>
            {fieldErrors[title] ? (
              <p className="mt-2 text-xs font-medium text-red-600">{fieldErrors[title]}</p>
            ) : null}

            {(uploadedFiles[title] ?? []).length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {(uploadedFiles[title] ?? []).map((file, index) => (
                  <div key={`${file.name}-${index}`} className="group relative">
                    {previewUrls[title]?.[index] ? (
                      <img
                        src={previewUrls[title][index]}
                        alt={file.name}
                        className="h-20 w-full rounded-lg border border-gray-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-100">
                        <FileText className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(title, index)}
                      className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 truncate rounded-b-lg bg-black bg-opacity-50 p-1 text-xs text-white">
                      {file.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
