import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { MapPin, Star } from "lucide-react";

import {
  BusinessListingCardTitle,
  BusinessListingStatusBadges,
} from "@/components/business/BusinessListingCardChrome";
import { DirectMessageButton } from "@/components/business/DirectMessageButton";
import { FollowVendorButton } from "@/components/business/FollowVendorButton";
import { ShowPhoneNumberReveal } from "@/components/ShowPhoneNumberReveal";
import { businessProfilePath } from "@/lib/businessProfile";
import { resolveBusinessContactPhone } from "@/lib/whatsappUrl";
import type { SocialAccount } from "@/features/business/socialAccounts";
import { cn } from "@/lib/utils";

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
  isPremium?: boolean;
  boostStatus?: "active" | "none";
  isFollowing?: boolean;
  followersCount?: number;
  phone?: string | null;
  whatsapp?: string | null;
  vendorUserId?: number | null;
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
  isPremium = false,
  boostStatus = "none",
  isFollowing = false,
  followersCount = 0,
  phone,
  whatsapp,
  vendorUserId,
  vendorUserUuid,
  socialAccounts,
}: FeaturedCardProps) {
  const contactPhone = resolveBusinessContactPhone(whatsapp, phone);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const listingPath = businessProfilePath(id);
  const isBoosted = boostStatus === "active";
  const [following, setFollowing] = useState(isFollowing);
  const [localFollowersCount, setLocalFollowersCount] = useState(followersCount);

  useEffect(() => {
    setFollowing(isFollowing);
  }, [isFollowing, vendorUserId]);

  useEffect(() => {
    setLocalFollowersCount(followersCount);
  }, [followersCount, id]);

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
          isPremium,
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
        "flex h-full flex-col overflow-hidden rounded-lg bg-card shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        isBoosted && "ring-2 ring-amber-400/60",
      )}
    >
      <div className="relative">
        <img
          src={image}
          alt="Business Image"
          className="w-full h-48 object-cover"
        />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <BusinessListingStatusBadges isPremium={isPremium} isBoosted={isBoosted} />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-6">
        <div className="mb-1 flex items-start justify-between gap-2">
          <BusinessListingCardTitle businessId={id} businessName={name} verified={verified} />
          {vendorUserId ? (
            <div className="relative z-10 shrink-0" onClick={(event) => event.stopPropagation()}>
              <FollowVendorButton
                businessId={id}
                followingUserId={vendorUserId}
                initialFollowing={following}
                listingPath={listingPath}
                size="compact"
                variant="pill"
                onFollowChange={(nextFollowing, count) => {
                  setFollowing(nextFollowing);
                  if (typeof count === "number") {
                    setLocalFollowersCount(count);
                  } else {
                    setLocalFollowersCount((current) =>
                      Math.max(0, current + (nextFollowing ? 1 : -1)),
                    );
                  }
                }}
              />
            </div>
          ) : null}
        </div>
        <p className="text-primary text-sm font-inter font-medium mb-2">
          {category}
        </p>
        {localFollowersCount > 0 ? (
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {localFollowersCount.toLocaleString()}{" "}
            {localFollowersCount === 1 ? "follower" : "followers"}
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
        <p className="mb-4 line-clamp-2 flex-1 font-normal font-inter text-sm text-text-secondary">
          {description}
        </p>
        <div className="mt-auto shrink-0 space-y-3">
          <ShowPhoneNumberReveal
            phoneNumber={contactPhone}
            className="flex w-full items-center justify-center rounded-lg bg-destructive py-2 font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90"
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
    </div>
  );
}
