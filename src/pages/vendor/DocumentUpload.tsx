import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import File from "@/components/sections/vendor/document/File";
import Header from "@/components/sections/vendor/document/Header";
import VerifyIdentity from "@/components/sections/vendor/document/VerifyIdentity";
import { Button } from "@/components/ui/button";
import {
  fetchVerificationStatus,
  primeVerificationDocumentSession,
} from "@/features/verification/vendorVerificationApi";

export default function DocumentUpload() {
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({
    "Business Registration": [],
    "Identity Proof": [],
    "Address Proof": [],
  });

  const { data: status, isLoading } = useQuery({
    queryKey: ["vendor", "verification", "status", "document-upload"],
    queryFn: fetchVerificationStatus,
    staleTime: 0,
  });

  useEffect(() => {
    if (!status) {
      return;
    }

    primeVerificationDocumentSession(status);

    if (status.verification_status === "pending" || status.verification_status === "approved") {
      navigate("/vendor/after-verification", { replace: true });
      return;
    }

    if (!status.awaiting_document_submission && !status.consumable_payment_id) {
      navigate("/vendor/verification", { replace: true });
    }
  }, [status, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const showAwaitingBanner = status?.awaiting_document_submission === true;

  return (
    <div className="container mx-auto p-2 md:p-4">
      {showAwaitingBanner ? (
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-sky-950">
            Payment complete. Upload all required files below, then click{" "}
            <span className="font-semibold">Submit verification request</span>.
          </p>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 border-sky-300 text-sky-900 hover:bg-sky-100"
            onClick={() => navigate("/vendor/verification")}
          >
            Continue later
          </Button>
        </div>
      ) : null}

      <Header />
      <File uploadedFiles={uploadedFiles} onFilesChange={setUploadedFiles} />
      <VerifyIdentity
        uploadedFiles={uploadedFiles}
        paymentId={status?.consumable_payment_id ?? null}
      />
    </div>
  );
}
