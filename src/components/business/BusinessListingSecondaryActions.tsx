import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Heart, Share2 } from "lucide-react";

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
};

export function BusinessListingSecondaryActions({
  businessId,
  businessName,
  website,
  initialFavorite,
  listingPath,
}: BusinessListingSecondaryActionsProps) {
  const queryClient = useQueryClient();
  const { isSessionLoading, isUserLoading } = useAuth();
  const { requireAuthNavigate, isAuthReady, isAuthenticated } =
    useRequireAuthNavigate();
  const { copy } = useClipboard();
  const [isFavorited, setIsFavorited] = useState(initialFavorite);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

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
        showSuccess("Removed from saved listings");
      } else {
        const result = await toggleFavorite(businessId);
        setIsFavorited(result.favorited);
        showSuccess(
          result.favorited ? "Saved to your favorites" : "Removed from saved listings",
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
      showSuccess("Listing link copied to clipboard");
    } catch {
      showError("Could not copy link. Please try again.");
    }
  }

  return (
    <div className="mt-6 flex items-center justify-between text-xs font-medium uppercase tracking-tight text-stat-muted">
      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={favoriteLoading || !isAuthReady}
        aria-pressed={isFavorited}
        aria-label={isFavorited ? "Remove from saved listings" : "Save listing"}
        className={cn(
          "inline-flex items-center gap-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          isFavorited ? "text-brand-red" : "hover:text-ink",
        )}
      >
        <Heart
          className={cn("size-4", isFavorited && "fill-brand-red text-brand-red")}
          aria-hidden
        />
        {isFavorited ? "Saved" : "Save"}
      </button>

      <button
        type="button"
        onClick={handleWebsite}
        disabled={!websiteUrl}
        aria-label={websiteUrl ? "Open business website" : "Website not available"}
        title={websiteUrl ? "Open website in a new tab" : "No website listed"}
        className={cn(
          "inline-flex items-center gap-1 transition-colors",
          websiteUrl
            ? "hover:text-ink"
            : "cursor-not-allowed opacity-40",
        )}
      >
        <ExternalLink className="size-4" aria-hidden />
        Website
      </button>

      <button
        type="button"
        onClick={() => void handleShare()}
        aria-label="Share listing"
        className="inline-flex items-center gap-1 hover:text-ink"
      >
        <Share2 className="size-4" aria-hidden />
        Share listing
      </button>
    </div>
  );
}
