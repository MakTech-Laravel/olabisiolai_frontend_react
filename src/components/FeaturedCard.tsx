import { useLocation, useNavigate } from "react-router-dom";
import {
  Heart,
  Star,
  MapPin,
  CheckCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { BusinessProfileLink } from "@/components/business/BusinessProfileLink";
import { DirectMessageButton } from "@/components/business/DirectMessageButton";
import { ShowPhoneNumberReveal } from "@/components/ShowPhoneNumberReveal";
import { businessProfilePath } from "@/lib/businessProfile";
import { resolveBusinessContactPhone } from "@/lib/whatsappUrl";
import {
  getFavoriteErrorMessage,
  removeFavorite,
  toggleFavorite,
} from "@/api/favorites";
import type { SocialAccount } from "@/features/business/socialAccounts";
import { showError, showSuccess } from "@/lib/sweetAlert";

interface FeaturedCardProps {
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
  socialAccounts?: SocialAccount[];
}

export function FeaturedCard({
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
  socialAccounts,
}: FeaturedCardProps) {
  const contactPhone = resolveBusinessContactPhone(whatsapp, phone);
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(favorited);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    setIsFavorited(favorited);
  }, [favorited]);

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
          socialAccounts: socialAccounts ?? [],
        },
      },
    });
  };

  const handleFavorite = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (favoriteLoading) return;

    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        await removeFavorite(id);
        setIsFavorited(false);
      } else {
        const result = await toggleFavorite(id);
        setIsFavorited(result.favorited);
        showSuccess(
          result.favorited ? "Saved to your favorites" : "Removed from saved listings",
        );
      }
      await queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
      await queryClient.invalidateQueries({ queryKey: ["businesses", "home"] });
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
      className="bg-card rounded-lg shadow-md overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 h-130 flex flex-col"
    >
      <div className="relative">
        <img
          src={image}
          alt="Business Image"
          className="w-full h-48 object-cover"
        />

        {verified && (
          <div className="absolute top-4 left-4 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" /> VERIFIED
          </div>
        )}
        <button
          onClick={handleFavorite}
          disabled={favoriteLoading}
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            className={`w-5 h-5 transition-colors duration-200 ${isFavorited
              ? "fill-brand-red text-brand-red"
              : "text-gray-600 hover:text-brand-red"
              }`}
          />
        </button>
      </div>
      <div className="p-6 flex flex-col flex-1">
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
        <p className="font-normal font-inter text-sm text-text-secondary mb-6 flex-1 line-clamp-2">
          {description}
        </p>
        <ShowPhoneNumberReveal
          phoneNumber={contactPhone}
          className="mb-3 flex w-full items-center justify-center rounded-lg bg-destructive py-2 font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90"
          iconClassName="size-5 shrink-0"
        />
        <DirectMessageButton
          businessInfoId={id}
          vendorUserUuid={vendorUserUuid}
          fromPath={pathname}
          className="w-full py-2"
          iconClassName="w-5 h-5 mr-2"
        />
      </div>
    </div>
  );
}
