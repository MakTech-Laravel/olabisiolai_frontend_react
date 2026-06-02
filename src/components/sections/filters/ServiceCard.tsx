import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, MapPin, Star, CheckCircle } from "lucide-react";

import {
  getFavoriteErrorMessage,
  removeFavorite,
  toggleFavorite,
} from "@/api/favorites";
import { BusinessProfileLink } from "@/components/business/BusinessProfileLink";
import { DirectMessageButton } from "@/components/business/DirectMessageButton";
import { ShowPhoneNumberReveal } from "@/components/ShowPhoneNumberReveal";
import { useAuth } from "@/auth/useAuth";
import {
  fulfillPendingFavoriteSaveForBusiness,
  setPendingFavoriteSave,
} from "@/features/auth/pendingFavoriteSave";
import { useRequireAuthNavigate } from "@/features/auth/useRequireAuthNavigate";
import { businessProfilePath } from "@/lib/businessProfile";
import { showError, showSuccess } from "@/lib/sweetAlert";
import { resolveBusinessContactPhone } from "@/lib/whatsappUrl";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  id: number;
  name: string;
  category: string;
  subcategory?: string | null;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  rating: number;
  reviews: number;
  description: string;
  image: string;
  logoUrl?: string;
  coverPhotoUrls?: string[];
  verified: boolean;
  favorited?: boolean;
  phone?: string | null;
  whatsapp?: string | null;
  vendorUserUuid?: string | null;
}

export default function ServiceCard({
  id,
  name,
  category,
  subcategory,
  location,
  latitude,
  longitude,
  rating,
  reviews,
  description,
  image,
  logoUrl,
  coverPhotoUrls,
  verified,
  favorited = false,
  phone,
  whatsapp,
  vendorUserUuid,
}: ServiceCardProps) {
  const contactPhone = resolveBusinessContactPhone(whatsapp, phone);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isSessionLoading, isUserLoading, isAuthenticated } = useAuth();
  const { requireAuthNavigate, isAuthReady } = useRequireAuthNavigate();
  const [isFavorited, setIsFavorited] = useState(favorited);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    setIsFavorited(favorited);
  }, [favorited, id]);

  useEffect(() => {
    if (isSessionLoading || isUserLoading || !isAuthenticated || isFavorited) {
      return;
    }

    let cancelled = false;
    void (async () => {
      const saved = await fulfillPendingFavoriteSaveForBusiness(queryClient, id);
      if (!cancelled && saved) {
        setIsFavorited(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    id,
    isAuthenticated,
    isFavorited,
    isSessionLoading,
    isUserLoading,
    queryClient,
  ]);

  const goToService = () => {
    navigate(businessProfilePath(id), {
      state: {
        from: pathname,
        business: {
          id,
          name,
          category,
          subcategory: subcategory ?? null,
          location,
          latitude: latitude ?? null,
          longitude: longitude ?? null,
          rating,
          reviews,
          description,
          image,
          logoUrl: logoUrl ?? image,
          coverPhotoUrls: coverPhotoUrls ?? (image ? [image] : []),
          verified,
          isFavorite: isFavorited,
          phone: phone ?? null,
          whatsapp: whatsapp ?? null,
          vendorUserUuid: vendorUserUuid ?? null,
        },
      },
    });
  };

  const handleFavorite = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!isAuthReady || favoriteLoading) return;

    if (!isAuthenticated) {
      setPendingFavoriteSave(id);
      requireAuthNavigate(pathname, { state: { from: pathname } });
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        await removeFavorite(id);
        setIsFavorited(false);
        showSuccess("Removed from saved listings");
      } else {
        const result = await toggleFavorite(id);
        setIsFavorited(result.favorited);
        showSuccess(
          result.favorited ? "Saved to your favorites" : "Removed from saved listings",
        );
      }
      await queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
      await queryClient.invalidateQueries({ queryKey: ["filters"] });
      await queryClient.invalidateQueries({ queryKey: ["business", id] });
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
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goToService}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          goToService();
        }
      }}
      className="bg-card rounded-lg shadow-md overflow-hidden flex mb-6 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      <div className="w-full relative">
        <img
          src={image}
          alt="Business Image"
          className="w-full h-full object-cover"
        />

        {verified && (
          <div className="absolute top-4 left-4 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" /> VERIFIED
          </div>
        )}
        <button
          type="button"
          onClick={(event) => void handleFavorite(event)}
          disabled={favoriteLoading || !isAuthReady}
          className="absolute top-4 right-4 rounded-full bg-card p-2 shadow-md transition-colors hover:bg-card/95 disabled:cursor-not-allowed disabled:opacity-50"
          aria-pressed={isFavorited}
          aria-label={isFavorited ? "Remove from favorites" : "Save listing"}
        >
          <Heart
            className={cn(
              "size-5 transition-colors",
              isFavorited
                ? "fill-brand-red text-brand-red"
                : "text-muted-foreground hover:text-brand-red",
            )}
            aria-hidden
          />
        </button>
      </div>
      <div className="w-full p-6">
        <h3 className="text-lg font-inter font-semibold text-text-primary mb-1">
          <BusinessProfileLink businessId={id} businessName={name} />
        </h3>
        <p className="text-primary text-sm font-inter font-medium mb-2">
          {category}
        </p>
        <div className="flex items-center mb-2">
          <MapPin className="w-4 h-4 mr-1 text-text-secondary" />
          <span className="text-sm text-text-secondary font-inter font-medium wrap-break-word">
            {location}
          </span>
        </div>
        <div className="flex items-center text-sm mb-4">
          <Star className="w-4 h-4 text-yellow-400 mr-1 fill-current" />
          <span className="font-medium font-inter text-sm text-text-primary">
            {rating}
          </span>
          <span className="font-normal font-inter text-sm text-text-secondary">
            ({reviews})
          </span>
        </div>
        <p className="font-normal font-inter text-sm text-text-secondary mb-6">
          {description}
        </p>

        <ShowPhoneNumberReveal
          phoneNumber={contactPhone}
          className="mb-3 flex w-full items-center justify-center rounded-lg bg-destructive p-1 text-sm font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 lg:w-50 lg:p-3"
          iconClassName="size-4 shrink-0"
        />

        <DirectMessageButton
          businessInfoId={id}
          vendorUserUuid={vendorUserUuid}
          fromPath={pathname}
          className="lg:w-50 w-full lg:p-3 p-1"
        />

      </div>
    </div>
  );
}
