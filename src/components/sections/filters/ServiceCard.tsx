import { useLocation, useNavigate } from "react-router-dom";
import { MapPin, Star, CheckCircle, Zap } from "lucide-react";

import { BusinessProfileLink } from "@/components/business/BusinessProfileLink";
import { DirectMessageButton } from "@/components/business/DirectMessageButton";
import { FollowVendorButton } from "@/components/business/FollowVendorButton";
import { ShowPhoneNumberReveal } from "@/components/ShowPhoneNumberReveal";
import { businessProfilePath } from "@/lib/businessProfile";
import type { SocialAccount } from "@/features/business/socialAccounts";
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
  boostStatus?: "active" | "none";
  isFollowing?: boolean;
  followersCount?: number;
  phone?: string | null;
  whatsapp?: string | null;
  vendorUserId?: number | null;
  vendorUserUuid?: string | null;
  socialAccounts?: SocialAccount[];
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
  boostStatus = "none",
  isFollowing = false,
  followersCount = 0,
  phone,
  whatsapp,
  vendorUserId,
  vendorUserUuid,
  socialAccounts,
}: ServiceCardProps) {
  const contactPhone = resolveBusinessContactPhone(whatsapp, phone);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const listingPath = businessProfilePath(id);
  const isBoosted = boostStatus === "active";

  const goToService = () => {
    navigate(listingPath, {
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
          phone: phone ?? null,
          whatsapp: whatsapp ?? null,
          vendorUserUuid: vendorUserUuid ?? null,
          socialAccounts: socialAccounts ?? [],
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
      className={cn(
        "bg-card rounded-lg shadow-md overflow-hidden flex mb-6 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 flex-col xl:flex-row",
        isBoosted && "ring-2 ring-amber-400/60",
      )}
    >
      <div className="w-full relative">
        <img
          src={image}
          alt="Business Image"
          className="w-full h-full object-cover"
        />

        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {verified ? (
            <div className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" /> VERIFIED
            </div>
          ) : null}
          {isBoosted ? (
            <div className="bg-amber-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center">
              <Zap className="w-3 h-3 mr-1" /> BOOSTED
            </div>
          ) : null}
        </div>
      </div>
      <div className="w-full p-6">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-inter font-semibold text-text-primary">
            <BusinessProfileLink businessId={id} businessName={name} />
          </h3>
          {vendorUserId ? (
            <FollowVendorButton
              followingUserId={vendorUserId}
              initialFollowing={isFollowing}
              listingPath={listingPath}
              size="compact"
              variant="pill"
            />
          ) : null}
        </div>
        <p className="text-primary text-sm font-inter font-medium mb-2">
          {category}
        </p>
        {followersCount > 0 ? (
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {followersCount.toLocaleString()} {followersCount === 1 ? "follower" : "followers"}
          </p>
        ) : null}
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
