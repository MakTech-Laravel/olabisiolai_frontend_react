import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  Flag,
  Heart,
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
import {
  getFavoriteErrorMessage,
  removeFavorite,
  toggleFavorite,
} from "@/api/favorites";
import {
  fulfillPendingFavoriteSaveForBusiness,
  setPendingFavoriteSave,
} from "@/features/auth/pendingFavoriteSave";
import { useAuth } from "@/auth/useAuth";
import { useRequireAuthNavigate } from "@/features/auth/useRequireAuthNavigate";
import { useClipboard } from "@/hooks/useClipboard";
import { normalizeWebsiteUrl } from "@/lib/websiteUrl";
import { showError, showSuccess } from "@/lib/sweetAlert";
import { cn } from "@/lib/utils";

type BusinessListingSecondaryActionsProps = {
  businessId: number;
  businessName: string;
  website: string | null | undefined;
  initialFavorite: boolean;
  listingPath: string;
  isOwnBusiness?: boolean;
  allowSave?: boolean;
  allowReport?: boolean;
};

export function BusinessListingSecondaryActions({
  businessId,
  businessName,
  website,
  initialFavorite,
  listingPath,
  isOwnBusiness = false,
  allowSave = true,
  allowReport = true,
}: BusinessListingSecondaryActionsProps) {
  const queryClient = useQueryClient();
  const { isSessionLoading, isUserLoading } = useAuth();
  const { requireAuthNavigate, isAuthReady, isAuthenticated } =
    useRequireAuthNavigate();
  const { copy } = useClipboard();
  const [isFavorited, setIsFavorited] = useState(initialFavorite);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const websiteUrl = normalizeWebsiteUrl(website);

  useEffect(() => {
    setIsFavorited(initialFavorite);
  }, [initialFavorite, businessId]);

  useEffect(() => {
    if (isSessionLoading || isUserLoading || !isAuthenticated || isFavorited) {
      return;
    }

    let cancelled = false;
    void (async () => {
      const saved = await fulfillPendingFavoriteSaveForBusiness(
        queryClient,
        businessId,
      );
      if (!cancelled && saved) {
        setIsFavorited(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    businessId,
    isAuthenticated,
    isFavorited,
    isSessionLoading,
    isUserLoading,
    queryClient,
  ]);

  async function handleSave() {
    if (!isAuthReady || favoriteLoading) return;

    if (!isAuthenticated) {
      setPendingFavoriteSave(businessId);
      requireAuthNavigate(listingPath, {
        state: { from: listingPath },
      });
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        await removeFavorite(businessId);
        setIsFavorited(false);
        showSuccess("Removed from saved vendors");
      } else {
        const result = await toggleFavorite(businessId);
        setIsFavorited(result.favorited);
        showSuccess(
          result.favorited ? "Saved to your vendors" : "Removed from saved vendors",
        );
      }
      await queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
      await queryClient.invalidateQueries({ queryKey: ["business", businessId] });
      await queryClient.invalidateQueries({ queryKey: ["businesses"] });
    } catch (error) {
      showError(
        getFavoriteErrorMessage(
          error,
          "Could not update saved listing. Please try again.",
        ),
      );
    } finally {
      setFavoriteLoading(false);
    }
  }

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
        {!isOwnBusiness && allowSave ? (
          <Button
            type="button"
            variant="outline"
            disabled={favoriteLoading || !isAuthReady}
            aria-pressed={isFavorited}
            onClick={() => void handleSave()}
            className={cn(
              "h-12 w-full rounded-xl border-border-light text-base font-medium",
              isFavorited && "border-brand-red/30 bg-brand-red/5 text-brand-red hover:bg-brand-red/10",
            )}
          >
            <Heart
              className={cn(
                "mr-2 size-5 shrink-0",
                isFavorited && "fill-brand-red text-brand-red",
              )}
              aria-hidden
            />
            {isFavorited ? "Saved" : "Save vendor"}
          </Button>
        ) : null}

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
