import { useState } from "react";
import {
  ExternalLink,
  Flag,
  MoreHorizontal,
  Share2,
} from "lucide-react";

import { ReportAbuseModal } from "@/components/Modal/ReportAbuseModal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRequireAuthNavigate } from "@/features/auth/useRequireAuthNavigate";
import { useClipboard } from "@/hooks/useClipboard";
import { normalizeWebsiteUrl } from "@/lib/websiteUrl";
import { showError, showSuccess } from "@/lib/sweetAlert";

type BusinessListingSecondaryActionsProps = {
  businessId: number;
  businessName: string;
  website: string | null | undefined;
  listingPath: string;
  isOwnBusiness?: boolean;
  allowReport?: boolean;
};

export function BusinessListingSecondaryActions({
  businessId,
  businessName,
  website,
  listingPath,
  isOwnBusiness = false,
  allowReport = true,
}: BusinessListingSecondaryActionsProps) {
  const { requireAuthNavigate, isAuthReady, isAuthenticated } =
    useRequireAuthNavigate();
  const { copy } = useClipboard();
  const [reportOpen, setReportOpen] = useState(false);

  const websiteUrl = normalizeWebsiteUrl(website);

  function handleWebsite() {
    if (!websiteUrl) return;
    window.open(websiteUrl, "_blank", "noopener,noreferrer");
  }

  function handleReport() {
    if (!isAuthReady) return;

    if (!isAuthenticated) {
      requireAuthNavigate(listingPath, {
        state: { from: listingPath },
      });
      return;
    }

    setReportOpen(true);
  }

  async function handleShare() {
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${listingPath}`
        : listingPath;
    const sharePayload = {
      title: businessName,
      text: `Check out ${businessName} on Gidira`,
      url: shareUrl,
    };

    if (typeof navigator.share === "function") {
      try {
        await navigator.share(sharePayload);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await copy(shareUrl);
      showSuccess("Vendor link copied to clipboard");
    } catch {
      showError("Could not copy link. Please try again.");
    }
  }

  return (
    <>
      <div className="mt-6 space-y-3 border-t border-border-light pt-5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full rounded-xl border-border-light text-base font-medium text-ink"
            >
              <MoreHorizontal className="mr-2 size-5 shrink-0" aria-hidden />
              More
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => void handleShare()}>
              <Share2 className="size-4" aria-hidden />
              Share vendor
            </DropdownMenuItem>
            {!isOwnBusiness && allowReport ? (
              <DropdownMenuItem onClick={handleReport}>
                <Flag className="size-4" aria-hidden />
                Report vendor
              </DropdownMenuItem>
            ) : null}
            {websiteUrl ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleWebsite}>
                  <ExternalLink className="size-4" aria-hidden />
                  Visit website
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ReportAbuseModal
        open={reportOpen}
        businessId={businessId}
        businessName={businessName}
        onClose={() => setReportOpen(false)}
      />
    </>
  );
}
