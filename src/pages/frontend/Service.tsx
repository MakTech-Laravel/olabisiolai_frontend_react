import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchPublicBusinessById,
  resolvePublicBusinessSubcategory,
  type PublicBusiness,
} from "@/features/business/publicBusinessApi";
import type { SocialAccount } from "@/features/business/socialAccounts";
import { fetchBusinessReviews } from "@/features/reviews/publicReviewApi";
import { resolveBusinessIdFromSlug } from "@/lib/encryptId";
import { businessProfilePath } from "@/lib/businessProfile";
import { catalogItemDetailPath } from "@/lib/catalogItemDetail";

import { BusinessPublicPageView } from "@/components/business/BusinessPublicPageView";
import { BusinessOwnerEditView } from "@/components/profile/BusinessOwnerEditView";
import { VendorOwnerEditShell, type OwnerPageMode } from "@/components/profile/VendorOwnerEditShell";
import { useProfileViewMode } from "@/features/profile/useProfileViewMode";
import { ServicePhotosModal } from "@/components/Modal/ServicePhotosModal";
import { BusinessImageLightbox } from "@/components/business/BusinessImageLightbox";
import { useRequireAuthNavigate } from "@/features/auth/useRequireAuthNavigate";
import { Button } from "@/components/ui/button";
import { container } from "@/lib/container";
import { FREE_PHOTO_LIMIT, PREMIUM_PHOTO_LIMIT } from "@/constants/planLimits";
import {
  buildBusinessWhatsAppUrl,
  resolveBusinessContactPhone,
} from "@/lib/whatsappUrl";

const FALLBACK_COVER = "/images/service/hero.jpg";
const FALLBACK_LOGO = "/images/service/avatar.jpg";

interface StateBusinessData {
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
  servicesOffered?: string[];
  verified: boolean;
  memberSince?: string | null;
  verifiedSince?: string | null;
  isFavorite?: boolean;
  followersCount?: number;
  isFollowing?: boolean;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  socialAccounts?: SocialAccount[];
  vendorUserId?: number | null;
  vendorUserUuid?: string | null;
}

function toPublicBusinessPlaceholder(data: StateBusinessData): PublicBusiness {
  return {
    id: data.id,
    name: data.name,
    category: data.category,
    subcategory: data.subcategory ?? null,
    location: data.location,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    rating: data.rating,
    reviews: data.reviews,
    description: data.description,
    image: data.image,
    logoUrl: data.logoUrl ?? data.image,
    coverPhotoUrls: data.coverPhotoUrls ?? (data.image ? [data.image] : []),
    servicesOffered: data.servicesOffered ?? [],
    verified: data.verified,
    memberSince: data.memberSince ?? null,
    verifiedSince: data.verifiedSince ?? null,
    responseTimeLabel: null,
    isFavorite: data.isFavorite ?? false,
    followersCount: data.followersCount ?? 0,
    isFollowing: data.isFollowing ?? false,
    boostStatus: "none",
    isPremium: false,
    vendorUserId: data.vendorUserId ?? null,
    vendorUserUuid: data.vendorUserUuid ?? null,
    phone: data.phone ?? null,
    whatsapp: data.whatsapp ?? null,
    website: data.website ?? null,
    socialAccounts: data.socialAccounts ?? [],
    businessHours: [],
    businessHoursDisplay: [],
    catalogItems: [],
    catalogLocked: true,
    catalogCount: 0,
  };
}

type ServiceLocationState = {
  from?: string;
  business?: StateBusinessData;
};

export default function Service() {
  const [photosOpen, setPhotosOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowingVendor, setIsFollowingVendor] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [displayDescription, setDisplayDescription] = useState("");
  const [ownerPageMode, setOwnerPageMode] = useState<OwnerPageMode>("edit");
  const reviewsRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { pathname } = location;
  const routeState = (location.state as ServiceLocationState | null) ?? null;
  const { slug } = useParams<{ slug: string }>();
  const { requireAuthNavigate, isAuthReady } = useRequireAuthNavigate();
  const queryClient = useQueryClient();

  const businessId = slug ? resolveBusinessIdFromSlug(slug) : null;
  const stateData = routeState?.business ?? null;

  // Legacy deep link: /businesses/:slug?catalog=1 → /catalog/items/1
  useEffect(() => {
    const catalogId = Number(searchParams.get("catalog") ?? "");
    if (!Number.isFinite(catalogId) || catalogId <= 0) return;
    navigate(catalogItemDetailPath(catalogId), {
      replace: true,
      state: {
        from: pathname,
        businessInfoId: businessId ?? undefined,
        businessName: stateData?.name,
      },
    });
  }, [searchParams, navigate, pathname, businessId, stateData?.name]);

  const refreshBusinessProfile = () => {
    if (businessId !== null) {
      void queryClient.invalidateQueries({ queryKey: ["business", businessId] });
    }
  };

  // Only reuse navigation state when it belongs to this listing (prevents cross-business contact bleed).
  const matchedStateData =
    stateData !== null && businessId !== null && stateData.id === businessId ? stateData : null;

  const {
    data: business,
    isFetching: businessFetching,
    isFetched: businessFetched,
    isError: businessError,
  } = useQuery<PublicBusiness | null>({
    queryKey: ["business", businessId],
    queryFn: () => fetchPublicBusinessById(businessId!),
    enabled: businessId !== null,
    staleTime: 5 * 60 * 1000,
    placeholderData:
      matchedStateData !== null ? toPublicBusinessPlaceholder(matchedStateData) : undefined,
  });

  const { data: reviewsResult, isLoading: reviewsLoading } = useQuery({
    queryKey: ["reviews", businessId, "preview"],
    queryFn: () => fetchBusinessReviews(businessId!, { page: 1, perPage: 5, sort: "top" }),
    enabled: businessId !== null,
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const reviewsList = reviewsResult?.data ?? [];
  const pagination = reviewsResult?.pagination ?? { current_page: 1, last_page: 1, total: 0 };

  const name = business?.name ?? matchedStateData?.name ?? "";
  const categoryLabel = business?.category ?? matchedStateData?.category ?? "";
  const categoryId = business?.categoryId ?? null;
  const subcategoryLabel = useMemo(() => {
    if (business) {
      return resolvePublicBusinessSubcategory(business);
    }
    const fromState = matchedStateData?.subcategory?.trim();
    return fromState || null;
  }, [business, matchedStateData?.subcategory]);
  const boostActive = business?.boostStatus === "active";
  const isPremium = business?.isPremium ?? false;
  const description = displayDescription || business?.description || matchedStateData?.description || "";

  const rating = business?.rating ?? matchedStateData?.rating ?? 0;
  const reviewCount = business?.reviews ?? matchedStateData?.reviews ?? 0;
  const locationText = business?.location ?? matchedStateData?.location ?? "";
  const latitude = business?.latitude ?? matchedStateData?.latitude ?? null;
  const longitude = business?.longitude ?? matchedStateData?.longitude ?? null;
  const verified = business?.verified ?? matchedStateData?.verified ?? false;
  const memberSince = business?.memberSince ?? matchedStateData?.memberSince ?? null;
  const responseTimeLabel = business?.responseTimeLabel ?? null;
  const photoLimit = isPremium ? PREMIUM_PHOTO_LIMIT : FREE_PHOTO_LIMIT;

  // Once API business is present, trust its contact fields (null/empty = intentional), never stale nav state.
  const displayPhone = business ? (business.phone ?? null) : (matchedStateData?.phone ?? null);
  const displayWhatsapp = business ? (business.whatsapp ?? null) : (matchedStateData?.whatsapp ?? null);
  const website = business ? (business.website ?? null) : (matchedStateData?.website ?? null);
  const socialAccounts = business
    ? (business.socialAccounts ?? [])
    : (matchedStateData?.socialAccounts ?? []);

  const contactPhone = resolveBusinessContactPhone(displayWhatsapp, displayPhone);
  const whatsappUrl = buildBusinessWhatsAppUrl(displayWhatsapp, displayPhone);

  const coverPhotos = useMemo(() => {
    const fromApi = business?.coverPhotoUrls ?? [];
    if (fromApi.length > 0) return fromApi;
    const fromState = matchedStateData?.coverPhotoUrls ?? [];
    if (fromState.length > 0) return fromState;
    const legacyImage = business?.image ?? matchedStateData?.image;
    return legacyImage && legacyImage !== FALLBACK_LOGO ? [legacyImage] : [];
  }, [business, matchedStateData]);

  const logoUrl =
    business?.logoUrl ??
    matchedStateData?.logoUrl ??
    business?.image ??
    matchedStateData?.image ??
    FALLBACK_LOGO;

  const publicLogoUrl = business?.logoUrl ?? matchedStateData?.logoUrl ?? null;

  const heroCover = coverPhotos[0] ?? FALLBACK_COVER;
  const vendorUserUuid = business?.vendorUserUuid ?? matchedStateData?.vendorUserUuid ?? null;
  const vendorUserId = business?.vendorUserId ?? matchedStateData?.vendorUserId ?? null;
  const { mode: profileMode, capabilities } = useProfileViewMode(vendorUserId);
  const isOwnerMode = profileMode === "vendorOwner";
  const resolvedIsFollowingVendor =
    business?.isFollowing ?? matchedStateData?.isFollowing ?? isFollowingVendor;

  useEffect(() => {
    setIsFollowingVendor(business?.isFollowing ?? matchedStateData?.isFollowing ?? false);
  }, [business?.isFollowing, matchedStateData?.isFollowing, businessId]);

  useEffect(() => {
    setDisplayName(name);
  }, [name]);

  useEffect(() => {
    setDisplayDescription(business?.description ?? matchedStateData?.description ?? "");
  }, [business?.description, matchedStateData?.description]);

  useEffect(() => {
    setFollowersCount(business?.followersCount ?? matchedStateData?.followersCount ?? 0);
  }, [business?.followersCount, matchedStateData?.followersCount]);

  const catalogItems = business?.catalogItems ?? [];
  const catalogLocked = business?.catalogLocked ?? !isPremium;
  const showOwnerEdit = isOwnerMode && ownerPageMode === "edit";
  const showCustomerActions = !isOwnerMode || ownerPageMode === "preview";
  const showDirectMessage =
    showCustomerActions && Boolean(vendorUserUuid) && !(isOwnerMode && ownerPageMode === "edit");
  const showCatalogSection = isPremium || isOwnerMode;
  const allReviewsPath = businessId ? `${businessProfilePath(businessId)}/reviews` : "/filters";

  const profileUnavailable =
    businessId === null ||
    (businessFetched && !businessFetching && !business && !matchedStateData);

  const handleWriteReview = () => {
    if (!isAuthReady || businessId === null) return;
    const reviewSearch = new URLSearchParams({
      business_id: String(businessId),
      ...(name ? { business_name: name } : {}),
    });
    requireAuthNavigate(`/reviews?${reviewSearch.toString()}`, {
      state: { from: pathname, business_id: businessId, business_name: name },
    });
  };

  if (profileUnavailable) {
    return (
      <div className="bg-bg-section font-sans text-ink">
        <div className={`${container} py-16 text-center`}>
          <h1 className="font-heading text-2xl font-bold text-ink">Business not found</h1>
          <p className="mt-2 text-body-secondary">
            {businessError
              ? "We could not load this profile. Please try again."
              : "This listing may be unavailable or the link is invalid."}
          </p>
          <Button asChild className="mt-6">
            <Link to="/filters">Browse businesses</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-section font-sans text-ink">
      {isOwnerMode ? (
        <VendorOwnerEditShell
          businessName={displayName || name}
          mode={ownerPageMode}
          onModeChange={setOwnerPageMode}
        >
          {showOwnerEdit ? (
            <BusinessOwnerEditView
              businessId={businessId!}
              businessName={name}
              displayName={displayName}
              displayDescription={displayDescription}
              categoryLabel={categoryLabel}
              subcategoryLabel={subcategoryLabel}
              logoUrl={logoUrl}
              heroCover={heroCover}
              coverPhotos={coverPhotos}
              photoLimit={photoLimit}
              isPremium={isPremium}
              verified={verified}
              boostActive={boostActive}
              phone={displayPhone}
              whatsapp={displayWhatsapp}
              website={website}
              socialAccounts={socialAccounts}
              business={business}
              onDisplayNameChange={setDisplayName}
              onDisplayDescriptionChange={setDisplayDescription}
              onProfileUpdated={refreshBusinessProfile}
            />
          ) : (
            <BusinessPublicPageView
              backTo={routeState?.from ?? "/filters"}
              pathname={pathname}
              businessId={businessId!}
              business={business}
              businessFetching={businessFetching}
              businessFetched={businessFetched}
              name={displayName || name}
              categoryLabel={categoryLabel}
              categoryId={categoryId}
              subcategoryLabel={subcategoryLabel}
              description={description}
              locationText={locationText}
              latitude={latitude}
              longitude={longitude}
              rating={rating}
              reviewCount={reviewCount}
              verified={verified}
              memberSince={memberSince}
              responseTimeLabel={responseTimeLabel}
              followersCount={followersCount}
              isFollowingVendor={resolvedIsFollowingVendor}
              vendorUserId={vendorUserId}
              vendorUserUuid={vendorUserUuid}
              boostActive={boostActive}
              isPremium={isPremium}
              heroCover={heroCover}
              logoUrl={publicLogoUrl}
              coverPhotos={coverPhotos}
              photoLimit={photoLimit}
              contactPhone={contactPhone}
              whatsappUrl={whatsappUrl}
              website={website}
              socialAccounts={socialAccounts}
              catalogItems={catalogItems}
              catalogLocked={catalogLocked}
              showCatalogSection={showCatalogSection}
              showCustomerActions={showCustomerActions}
              showDirectMessage={showDirectMessage}
              seeAllReviewsHref={allReviewsPath}
              capabilities={capabilities}
              reviewsRef={reviewsRef}
              reviewsList={reviewsList}
              reviewsLoading={reviewsLoading}
              pagination={pagination}
              onFollowersChange={(count, following) => {
                setFollowersCount(count);
                if (typeof following === "boolean") {
                  setIsFollowingVendor(following);
                }
              }}
              onOpenPhotos={() => setPhotosOpen(true)}
              onOpenPhotoAt={(index) => {
                setPhotoIndex(index);
                setLightboxOpen(true);
              }}
              onWriteReview={handleWriteReview}
              hideBackLink
            />
          )}
        </VendorOwnerEditShell>
      ) : (
        <BusinessPublicPageView
          backTo={routeState?.from ?? "/filters"}
          pathname={pathname}
          businessId={businessId!}
          business={business}
          businessFetching={businessFetching}
          businessFetched={businessFetched}
          name={displayName || name}
          categoryLabel={categoryLabel}
          subcategoryLabel={subcategoryLabel}
          description={description}
          locationText={locationText}
          latitude={latitude}
          longitude={longitude}
          rating={rating}
          reviewCount={reviewCount}
          verified={verified}
          memberSince={memberSince}
          responseTimeLabel={responseTimeLabel}
          followersCount={followersCount}
          isFollowingVendor={resolvedIsFollowingVendor}
          vendorUserId={vendorUserId}
          vendorUserUuid={vendorUserUuid}
          boostActive={boostActive}
          isPremium={isPremium}
          heroCover={heroCover}
          logoUrl={publicLogoUrl}
          coverPhotos={coverPhotos}
          photoLimit={photoLimit}
          contactPhone={contactPhone}
          whatsappUrl={whatsappUrl}
          website={website}
          socialAccounts={socialAccounts}
          catalogItems={catalogItems}
          catalogLocked={catalogLocked}
          showCatalogSection={showCatalogSection}
          showCustomerActions={showCustomerActions}
          showDirectMessage={showDirectMessage}
          seeAllReviewsHref={allReviewsPath}
          capabilities={capabilities}
          reviewsRef={reviewsRef}
          reviewsList={reviewsList}
          reviewsLoading={reviewsLoading}
          pagination={pagination}
          onFollowersChange={(count, following) => {
            setFollowersCount(count);
            if (typeof following === "boolean") {
              setIsFollowingVendor(following);
            }
          }}
          onOpenPhotos={() => setPhotosOpen(true)}
          onOpenPhotoAt={(index) => {
            setPhotoIndex(index);
            setLightboxOpen(true);
          }}
          onWriteReview={handleWriteReview}
        />
      )}

      <ServicePhotosModal
        open={photosOpen}
        onClose={() => setPhotosOpen(false)}
        businessName={name}
        photos={coverPhotos}
        initialIndex={photoIndex}
      />

      <BusinessImageLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        photos={coverPhotos}
        initialIndex={photoIndex}
        businessName={name}
      />
    </div>
  );
}
