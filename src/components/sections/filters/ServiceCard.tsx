import { Link, useLocation, useNavigate } from "react-router-dom";
import { Heart, MapPin, Star, CheckCircle, MessageCircle } from "lucide-react";

import { ShowPhoneNumberReveal } from "@/components/ShowPhoneNumberReveal";
import { useRequireAuthNavigate } from "@/features/auth/useRequireAuthNavigate";
import { encryptId } from "@/lib/encryptId";
import { resolveBusinessContactPhone } from "@/lib/whatsappUrl";

interface ServiceCardProps {
  id: number;
  name: string;
  category: string;
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
}

export default function ServiceCard({
  id,
  name,
  category,
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
}: ServiceCardProps) {
  const contactPhone = resolveBusinessContactPhone(whatsapp, phone);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { requireAuthNavigate, isAuthReady, isAuthenticated } =
    useRequireAuthNavigate();

  const goToService = () => {
    navigate(`/businesses/${encryptId(id)}`, {
      state: {
        from: pathname,
        business: {
          id,
          name,
          category,
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
          isFavorite: favorited,
          phone: phone ?? null,
          whatsapp: whatsapp ?? null,
        },
      },
    });
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
        <div className="absolute top-4 right-4 bg-card rounded-full p-2 shadow-md">
          <Heart className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
      <div className="w-full p-6">
        <h3 className="text-lg font-inter font-semibold text-text-primary mb-1">
          {name}
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

        <Link
          to="/messages"
          state={{ from: pathname }}
          onClick={(event) => {
            event.stopPropagation();
            if (!isAuthReady) {
              event.preventDefault();
              return;
            }
            if (!isAuthenticated) {
              event.preventDefault();
              requireAuthNavigate("/messages", { state: { from: pathname } });
            }
          }}
          className="border border-primary text-primary lg:w-50 w-full lg:p-3 p-1 rounded-lg flex items-center justify-center font-semibold hover:bg-primary/10 transition-colors text-sm"
        >
          <MessageCircle className="w-4 h-4 mr-1.5" aria-hidden />
          Direct Message
        </Link>

      </div>
    </div>
  );
}
