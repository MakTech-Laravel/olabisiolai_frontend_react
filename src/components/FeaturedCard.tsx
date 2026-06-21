import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Star,
  MapPin,
  CheckCircle,
  Zap,
} from "lucide-react";

import { BusinessProfileLink } from "@/components/business/BusinessProfileLink";
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
      <div className="flex min-h-0 flex-1 flex-col p-6">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-inter font-semibold text-text-primary">
            <BusinessProfileLink businessId={id} businessName={name} />
          </h3>
          {vendorUserId ? (
            <div className="relative z-10 shrink-0" onClick={(event) => event.stopPropagation()}>
              <FollowVendorButton
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
