import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
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

import { BusinessPublicPageView } from "@/components/business/BusinessPublicPageView";
import { BusinessOwnerEditView } from "@/components/profile/BusinessOwnerEditView";
import { VendorOwnerEditShell, type OwnerPageMode } from "@/components/profile/VendorOwnerEditShell";
import { useProfileViewMode } from "@/features/profile/useProfileViewMode";
import { ServicePhotosModal } from "@/components/Modal/ServicePhotosModal";
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
  const [reviewPage, setReviewPage] = useState(1);
  const [followersCount, setFollowersCount] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [displayDescription, setDisplayDescription] = useState("");
  const [ownerPageMode, setOwnerPageMode] = useState<OwnerPageMode>("edit");
  const reviewsRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const { pathname } = location;
  const routeState = (location.state as ServiceLocationState | null) ?? null;
  const { slug } = useParams<{ slug: string }>();
  const { requireAuthNavigate, isAuthReady } = useRequireAuthNavigate();
  const queryClient = useQueryClient();

  const businessId = slug ? resolveBusinessIdFromSlug(slug) : null;
  const stateData = routeState?.business ?? null;

  const refreshBusinessProfile = () => {
    if (businessId !== null) {
      void queryClient.invalidateQueries({ queryKey: ["business", businessId] });
    }
  };

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
      stateData !== null ? toPublicBusinessPlaceholder(stateData) : undefined,
  });

  const { data: reviewsResult } = useQuery({
    queryKey: ["reviews", businessId, reviewPage],
    queryFn: () => fetchBusinessReviews(businessId!, { page: reviewPage }),
    enabled: businessId !== null,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const reviewsList = reviewsResult?.data ?? [];
  const pagination = reviewsResult?.pagination ?? { current_page: 1, last_page: 1, total: 0 };

  const name = business?.name ?? stateData?.name ?? "";
  const categoryLabel = business?.category ?? stateData?.category ?? "";
  const categoryId = business?.categoryId ?? null;
  const subcategoryLabel = useMemo(() => {
    if (business) {
      return resolvePublicBusinessSubcategory(business);
    }
    const fromState = stateData?.subcategory?.trim();
    return fromState || null;
  }, [business, stateData?.subcategory]);
  const boostActive = business?.boostStatus === "active";
  const isPremium = business?.isPremium ?? false;
  const description = displayDescription || business?.description || stateData?.description || "";

  useEffect(() => {
    if (name) {
      document.title = `${name} | Gidira`;
    }
    return () => {
      document.title = "Gidira";
    };
  }, [name]);

  const rating = business?.rating ?? stateData?.rating ?? 0;
  const reviewCount = business?.reviews ?? stateData?.reviews ?? 0;
  const locationText = business?.location ?? stateData?.location ?? "";
  const latitude = business?.latitude ?? stateData?.latitude ?? null;
  const longitude = business?.longitude ?? stateData?.longitude ?? null;
  const verified = business?.verified ?? stateData?.verified ?? false;
  const memberSince = business?.memberSince ?? stateData?.memberSince ?? null;
  const responseTimeLabel = business?.responseTimeLabel ?? null;
  const photoLimit = isPremium ? PREMIUM_PHOTO_LIMIT : FREE_PHOTO_LIMIT;
  const contactPhone = resolveBusinessContactPhone(
    business?.whatsapp ?? stateData?.whatsapp,
    business?.phone ?? stateData?.phone,
  );
  const whatsappUrl = buildBusinessWhatsAppUrl(
    business?.whatsapp ?? stateData?.whatsapp,
    business?.phone ?? stateData?.phone,
  );
  const socialAccounts =
    business?.socialAccounts?.length
      ? business.socialAccounts
      : stateData?.socialAccounts ?? [];

  const coverPhotos = useMemo(() => {
    const fromApi = business?.coverPhotoUrls ?? [];
    if (fromApi.length > 0) return fromApi;
    const fromState = stateData?.coverPhotoUrls ?? [];
    if (fromState.length > 0) return fromState;
    const legacyImage = business?.image ?? stateData?.image;
    return legacyImage && legacyImage !== FALLBACK_LOGO ? [legacyImage] : [];
  }, [business, stateData]);

  const logoUrl =
    business?.logoUrl ??
    stateData?.logoUrl ??
    business?.image ??
    stateData?.image ??
    FALLBACK_LOGO;

  const publicLogoUrl = business?.logoUrl ?? stateData?.logoUrl ?? null;
  const website = business?.website ?? stateData?.website ?? null;

  const heroCover = coverPhotos[0] ?? FALLBACK_COVER;
  const vendorUserUuid = business?.vendorUserUuid ?? stateData?.vendorUserUuid ?? null;
  const vendorUserId = business?.vendorUserId ?? stateData?.vendorUserId ?? null;
  const { mode: profileMode, capabilities } = useProfileViewMode(vendorUserId);
  const isOwnerMode = profileMode === "vendorOwner";
  const isFollowingVendor = business?.isFollowing ?? stateData?.isFollowing ?? false;

  useEffect(() => {
    setDisplayName(name);
  }, [name]);

  useEffect(() => {
    setDisplayDescription(business?.description ?? stateData?.description ?? "");
  }, [business?.description, stateData?.description]);

  useEffect(() => {
    setFollowersCount(business?.followersCount ?? stateData?.followersCount ?? 0);
  }, [business?.followersCount, stateData?.followersCount]);

  const catalogItems = business?.catalogItems ?? [];
  const catalogLocked = business?.catalogLocked ?? !isPremium;
  const showOwnerEdit = isOwnerMode && ownerPageMode === "edit";
  const showCustomerActions = !isOwnerMode || ownerPageMode === "preview";
  const showDirectMessage =
    showCustomerActions && Boolean(vendorUserUuid) && !(isOwnerMode && ownerPageMode === "edit");
  const showCatalogSection = isPremium || isOwnerMode;
  const allReviewsPath = businessId ? `${businessProfilePath(businessId)}/reviews` : "/filters";

  const profileUnavailable =
    businessId === null || (businessFetched && !businessFetching && !business && !stateData);

  const handleWriteReview = () => {
    if (!isAuthReady) return;
    requireAuthNavigate("/reviews", {
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
              phone={business?.phone ?? stateData?.phone ?? null}
              whatsapp={business?.whatsapp ?? stateData?.whatsapp ?? null}
              website={business?.website ?? stateData?.website ?? null}
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
              isFollowingVendor={isFollowingVendor}
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
              pagination={pagination}
              reviewPage={reviewPage}
              onReviewPageChange={(page) => {
                setReviewPage(page);
                reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              onFollowersChange={(count) => setFollowersCount(count)}
              onOpenPhotos={() => setPhotosOpen(true)}
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
          isFollowingVendor={isFollowingVendor}
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
          pagination={pagination}
          reviewPage={reviewPage}
          onReviewPageChange={(page) => {
            setReviewPage(page);
            reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          onFollowersChange={(count) => setFollowersCount(count)}
          onOpenPhotos={() => setPhotosOpen(true)}
          onWriteReview={handleWriteReview}
        />
      )}

      <ServicePhotosModal
        open={photosOpen}
        onClose={() => setPhotosOpen(false)}
        businessName={name}
        photos={coverPhotos}
      />
    </div>
  );
}
