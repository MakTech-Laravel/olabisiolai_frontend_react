import type { QueryClient } from "@tanstack/react-query";

import {
  getFavoriteErrorMessage,
  toggleFavorite,
} from "@/api/favorites";
import { showError, showSuccess } from "@/lib/sweetAlert";

const STORAGE_KEY = "gidira.pendingFavoriteBusinessId";

function readPendingId(): number | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const id = Number.parseInt(raw, 10);
  if (!Number.isFinite(id) || id <= 0) {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
  return id;
}

/** Remember a listing the guest tried to save before login. */
export function setPendingFavoriteSave(businessInfoId: number): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, String(businessInfoId));
}

export function peekPendingFavoriteSave(): number | null {
  return readPendingId();
}

export function clearPendingFavoriteSave(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

async function invalidateFavoriteQueries(
  queryClient: QueryClient,
  businessInfoId: number,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["user-favorites"] }),
    queryClient.invalidateQueries({ queryKey: ["business", businessInfoId] }),
    queryClient.invalidateQueries({ queryKey: ["businesses"] }),
  ]);
}

/**
 * After login, add the listing the user tried to save while logged out.
 * Returns the business id that was saved, if any.
 */
export async function fulfillPendingFavoriteSave(
  queryClient: QueryClient,
): Promise<number | null> {
  const businessInfoId = readPendingId();
  if (businessInfoId === null) return null;

  try {
    const result = await toggleFavorite(businessInfoId);
    clearPendingFavoriteSave();
    if (result.favorited) {
      showSuccess("Saved to your favorites");
    }
    await invalidateFavoriteQueries(queryClient, businessInfoId);
    return businessInfoId;
  } catch (error) {
    showError(
      getFavoriteErrorMessage(
        error,
        "Could not save this listing. Please try Save again.",
      ),
    );
    return null;
  }
}

/** Run pending save when landing on the listing page (fallback after redirect). */
export async function fulfillPendingFavoriteSaveForBusiness(
  queryClient: QueryClient,
  businessInfoId: number,
): Promise<boolean> {
  const pendingId = peekPendingFavoriteSave();
  if (pendingId !== businessInfoId) return false;

  try {
    const result = await toggleFavorite(businessInfoId);
    clearPendingFavoriteSave();
    if (result.favorited) {
      showSuccess("Saved to your favorites");
    }
    await invalidateFavoriteQueries(queryClient, businessInfoId);
    return true;
  } catch (error) {
    showError(
      getFavoriteErrorMessage(
        error,
        "Could not save this listing. Please try Save again.",
      ),
    );
    return false;
  }
}
