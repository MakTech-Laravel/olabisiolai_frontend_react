import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  fetchPublicBusinessById,
  type PublicBusiness,
} from "@/features/business/publicBusinessApi";
import type { SocialAccount } from "@/features/business/socialAccounts";
import { fetchBusinessReviews } from "@/features/reviews/publicReviewApi";
import { resolveBusinessIdFromSlug } from "@/lib/encryptId";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Crown,
  MapPin,
  Shield,
  Sparkles,
  Star,
} from "lucide-react";

import { DirectMessageButton } from "@/components/business/DirectMessageButton";
import { BusinessListingSecondaryActions } from "@/components/business/BusinessListingSecondaryActions";
import { BusinessSocialLinks } from "@/components/business/BusinessSocialLinks";
import { BusinessHoursDisplay } from "@/components/business/BusinessHoursDisplay";
import { ServicePhotosModal } from "@/components/Modal/ServicePhotosModal";
import { BusinessServiceAreaMap } from "@/components/maps/BusinessServiceAreaMap";
import { ShowPhoneNumberReveal } from "@/components/ShowPhoneNumberReveal";
import { useAuth } from "@/auth/useAuth";
import { useRequireAuthNavigate } from "@/features/auth/useRequireAuthNavigate";
import { Button } from "@/components/ui/button";
import { env } from "@/config/env";
import { container } from "@/lib/container";
import { cn } from "@/lib/utils";
import { buildGoogleMapsSearchUrl } from "@/lib/googleMapsUrl";
import {
  buildBusinessWhatsAppUrl,
  resolveBusinessContactPhone,
} from "@/lib/whatsappUrl";

const FALLBACK_COVER = "/images/service/hero.jpg";
const FALLBACK_LOGO = "/images/service/avatar.jpg";

function AspectCover({ src, className }: { src: string; className?: string }) {
  return (
    <div className={cn("relative isolate overflow-hidden bg-border-light", className)}>
      <img
        src={src}
        alt=""
        className="absolute inset-0 block size-full object-cover"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

function StarRow({ rating = 0, className }: { rating?: number; className?: string }) {
  const clamped = Math.min(5, Math.max(0, rating));
  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      aria-label={`${clamped.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const diff = clamped - (i - 1);
        if (diff >= 1) {
          return (
            <Star key={i} className="size-5 shrink-0 fill-brand-red text-brand-red" aria-hidden />
          );
        }
        if (diff > 0) {
          const pct = Math.round(diff * 100);
          return (
            <span key={i} className="relative inline-flex size-5 shrink-0">
              <Star className="size-5 fill-brand-red/20 text-brand-red/40" aria-hidden />
              <span
                className="absolute left-0 top-0 h-full overflow-hidden"
                style={{ width: `${pct}%` }}
              >
                <Star className="size-5 fill-brand-red text-brand-red" aria-hidden />
              </span>
            </span>
          );
        }
        return (
          <Star key={i} className="size-5 shrink-0 fill-brand-red/20 text-brand-red/40" aria-hidden />
        );
      })}
    </div>
  );
}

interface StateBusinessData {
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
  servicesOffered?: string[];
  verified: boolean;
  memberSince?: string | null;
  verifiedSince?: string | null;
  isFavorite?: boolean;
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
    isFavorite: data.isFavorite ?? false,
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
  };
}

type ServiceLocationState = {
  from?: string;
  business?: StateBusinessData;
};

export default function Service() {
  const [photosOpen, setPhotosOpen] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const reviewsRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const { pathname } = location;
  const routeState = (location.state as ServiceLocationState | null) ?? null;
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { requireAuthNavigate, isAuthReady } = useRequireAuthNavigate();

  const businessId = slug ? resolveBusinessIdFromSlug(slug) : null;
  const stateData = routeState?.business ?? null;

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
    queryFn: () => fetchBusinessReviews(businessId!, reviewPage),
    enabled: businessId !== null,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const reviewsList = reviewsResult?.data ?? [];
  const pagination = reviewsResult?.pagination ?? { current_page: 1, last_page: 1, total: 0 };

  const name = business?.name ?? stateData?.name ?? "";
  const categoryLabel = business?.category ?? stateData?.category ?? "";
  const subcategoryLabel = business?.subcategory ?? null;
  const boostActive = business?.boostStatus === "active";
  const isPremium = business?.isPremium ?? false;
  const description = business?.description ?? stateData?.description ?? "";

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
  const ratingLabel =
    rating > 0
      ? `${Number.isInteger(rating) ? rating : rating.toFixed(1)} (${reviewCount} Reviews)`
      : reviewCount > 0
        ? `${reviewCount} ${reviewCount === 1 ? "Review" : "Reviews"}`
        : "No reviews yet";
  const locationText = business?.location ?? stateData?.location ?? "";
  const latitude = business?.latitude ?? stateData?.latitude ?? null;
  const longitude = business?.longitude ?? stateData?.longitude ?? null;
  const mapsUrl = locationText
    ? buildGoogleMapsSearchUrl(latitude, longitude, locationText)
    : null;
  const verified = business?.verified ?? stateData?.verified ?? false;
  const memberSince =
    business?.memberSince ?? stateData?.memberSince ?? null;
  const verifiedSince =
    business?.verifiedSince ?? stateData?.verifiedSince ?? null;
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

  const heroCover = coverPhotos[0] ?? FALLBACK_COVER;
  const vendorUserUuid =
    business?.vendorUserUuid ?? stateData?.vendorUserUuid ?? null;
  const vendorUserId = business?.vendorUserId ?? stateData?.vendorUserId ?? null;
  const isOwnBusiness =
    user != null &&
    vendorUserId != null &&
    Number(user.id) === vendorUserId;

  const servicesList =
    business?.servicesOffered?.length
      ? business.servicesOffered
      : stateData?.servicesOffered?.length
        ? stateData.servicesOffered
        : [];

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
        <div className={cn(container, "py-16 text-center")}>
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
      <div className={cn(container, "pb-16 pt-6 md:pt-10")}>
        <Link
          to={routeState?.from ?? "/filters"}
          className="inline-flex items-center gap-2 text-base font-normal text-accent-foreground hover:underline"
        >
          <ArrowLeft className="size-6 shrink-0" aria-hidden />
          Back
        </Link>

        <div className="mt-6 flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <div className="min-w-0 flex-1 space-y-10">
            <div className="relative">
              <AspectCover
                src={heroCover}
                className="w-full rounded-2xl shadow-md aspect-16/10 sm:aspect-2/1 lg:aspect-[2.65/1]"
              />
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-black/5" aria-hidden />
              {coverPhotos.length > 0 ? (
                <div className="absolute bottom-4 right-4 z-20 sm:bottom-6 sm:right-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="pointer-events-auto rounded-xl border-brand bg-ice px-6 py-4 text-base font-medium text-brand shadow-sm hover:bg-ice"
                    onClick={() => setPhotosOpen(true)}
                  >
                    See all Photos{coverPhotos.length > 1 ? ` (${coverPhotos.length})` : ""}
                  </Button>
                </div>
              ) : null}
              <div className="absolute -bottom-1 left-4 z-20 overflow-hidden rounded-xl border border-stat-muted bg-card shadow-sm sm:left-8 md:left-12">
                <AspectCover
                  src={logoUrl}
                  className="size-20 sm:size-24 md:h-[90px] md:w-[110px] md:max-w-[110px]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
              <div className="flex flex-col gap-10">
                <div className="space-y-4 pt-10 sm:pt-12">
                  <h1 className="font-heading text-4xl font-bold tracking-tight text-ink md:text-5xl lg:text-6xl lg:leading-17">
                    {name}
                  </h1>
                  {categoryLabel ? (
                    <p className="text-base font-semibold text-brand md:text-lg">
                      {categoryLabel}
                      {subcategoryLabel ? (
                        <span className="font-medium text-body-secondary">
                          {" "}
                          · {subcategoryLabel}
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-3">
                    {boostActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-amber-950">
                        <Sparkles className="size-3.5" aria-hidden />
                        Boosted Listing
                      </span>
                    ) : null}
                    {isPremium ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-brand">
                        <Crown className="size-3.5" aria-hidden />
                        Premium
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-ink md:text-base">
                    <StarRow rating={rating} />
                    <span>{ratingLabel}</span>
                    {verified && (
                      <>
                        <span className="text-stat-muted" aria-hidden>•</span>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                          <BadgeCheck className="size-4 shrink-0" aria-hidden />
                          Verified
                        </span>
                      </>
                    )}
                  </div>
                  <div className="space-y-4 text-base text-ink">
                    {locationText ? (
                      <p className="flex items-start gap-1">
                        <MapPin className="mt-0.5 size-6 shrink-0 text-brand-red" aria-hidden />
                        {mapsUrl ? (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand hover:underline"
                          >
                            {locationText}
                          </a>
                        ) : (
                          locationText
                        )}
                      </p>
                    ) : null}
                    {memberSince ? (
                      <p className="flex items-start gap-1">
                        <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-brand-red" aria-hidden />
                        Gidira member since {memberSince}
                      </p>
                    ) : null}
                    {verified && verifiedSince ? (
                      <p className="flex items-start gap-1">
                        <BadgeCheck className="mt-0.5 size-6 shrink-0 text-brand" aria-hidden />
                        Verified since {verifiedSince}.
                      </p>
                    ) : null}
                    {socialAccounts.length > 0 ? (
                      <BusinessSocialLinks
                        accounts={socialAccounts}
                        className="pt-1"
                        title="Connect on social"
                      />
                    ) : null}
                  </div>
                </div>

                <section className="space-y-6">
                  <h2 className="font-heading text-3xl font-semibold tracking-tight text-ink md:text-4xl">
                    Overview
                  </h2>
                  <p className="max-w-3xl text-lg leading-relaxed text-body-secondary">
                    {description || "No description available."}
                  </p>
                  {(verified || servicesList.length > 0) && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {verified ? (
                        <div className="flex flex-col gap-3 rounded-2xl bg-surface-soft p-6 shadow-sm">
                          <BadgeCheck className="size-6 text-brand" aria-hidden />
                          <h3 className="text-base font-semibold text-ink">Verified on Gidira</h3>
                          <p className="text-sm leading-5 text-body-secondary">
                            Identity and business details reviewed by our team.
                          </p>
                        </div>
                      ) : null}
                      {servicesList.length > 0 ? (
                        <div className="flex flex-col gap-3 rounded-2xl bg-surface-soft p-6 shadow-sm">
                          <CheckCircle2 className="size-6 text-brand" aria-hidden />
                          <h3 className="text-base font-semibold text-ink">Services offered</h3>
                          <p className="text-sm leading-5 text-body-secondary">
                            {servicesList.length}{" "}
                            {servicesList.length === 1 ? "service" : "services"} listed on this profile.
                          </p>
                        </div>
                      ) : null}
                      {contactPhone ? (
                        <div className="flex flex-col gap-3 rounded-2xl bg-surface-soft p-6 shadow-sm">
                          <Shield className="size-6 text-brand" aria-hidden />
                          <h3 className="text-base font-semibold text-ink">Direct contact</h3>
                          <p className="text-sm leading-5 text-body-secondary">
                            Call or message this business through Gidira.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </section>
              </div>

              <aside className="w-full shrink-0 space-y-6 lg:max-w-md lg:pt-24">
                <div className="relative rounded-3xl border border-border-light bg-card p-8 shadow-xl">
                  <div className="flex flex-col gap-6">
                    <ShowPhoneNumberReveal
                      useShadcnButton
                      isolateFromParentClicks={false}
                      phoneNumber={contactPhone}
                      className="h-14 w-full rounded-xl bg-brand-red text-base font-medium text-ice hover:bg-brand-red/90"
                      iconClassName="size-5 shrink-0"
                    />
                    {businessId !== null ? (
                      <DirectMessageButton
                        businessInfoId={businessId}
                        vendorUserUuid={vendorUserUuid}
                        fromPath={pathname}
                        disabled={isOwnBusiness}
                        className="h-14 w-full rounded-xl border border-ice bg-brand text-base font-medium text-ice hover:bg-brand/90 hover:text-ice"
                        iconClassName="size-5 shrink-0"
                      />
                    ) : null}
                    {whatsappUrl ? (
                      <Button
                        asChild
                        variant="outline"
                        className="h-14 rounded-xl border-brand bg-surface-soft text-base font-medium text-brand hover:bg-surface-soft"
                      >
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-full items-center justify-center gap-2"
                        >
                          <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          Chat via WhatsApp
                        </a>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        disabled
                        className="h-14 rounded-xl border-brand bg-surface-soft text-base font-medium text-brand opacity-60"
                      >
                        <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        WhatsApp unavailable
                      </Button>
                    )}
                  </div>
                  {socialAccounts.length > 0 ? (
                    <BusinessSocialLinks
                      accounts={socialAccounts}
                      className="border-t border-border-light pt-5"
                    />
                  ) : null}
                  <div className="mt-6 space-y-4 border-t border-border-light pt-5">
                    <p className="flex items-center gap-3 text-sm font-medium text-ink">
                      <Clock className="size-4 shrink-0 text-stat-muted" aria-hidden />
                      Usually responds within 15 mins
                    </p>
                    <p className="flex items-center gap-3 text-sm font-medium text-ink">
                      <Shield className="size-5 shrink-0 text-stat-muted" aria-hidden />
                      Secure transaction protection
                    </p>
                  </div>
                  {businessId !== null ? (
                    <BusinessListingSecondaryActions
                      businessId={businessId}
                      businessName={name}
                      website={business?.website ?? stateData?.website ?? null}
                      initialFavorite={
                        business?.isFavorite ?? stateData?.isFavorite ?? false
                      }
                      listingPath={pathname}
                    />
                  ) : null}
                </div>

                {businessFetching && !businessFetched ? (
                  <div className="rounded-2xl bg-surface-soft p-6">
                    <p className="text-sm font-semibold uppercase tracking-widest text-stat-muted">
                      Business Hours
                    </p>
                    <ul className="mt-4 space-y-2">
                      {[1, 2, 3].map((row) => (
                        <li key={row} className="flex justify-between gap-4">
                          <span className="h-4 w-24 animate-pulse rounded bg-border-light" />
                          <span className="h-4 w-32 animate-pulse rounded bg-border-light" />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : businessFetched && business ? (
                  <BusinessHoursDisplay
                    hours={business.businessHours}
                    displayRows={business.businessHoursDisplay}
                  />
                ) : null}
              </aside>
            </div>

            <section className="border-t border-border-gray pt-6">
              <h2 className="font-heading text-xl font-semibold text-ink-heading">Services</h2>
              {servicesList.length > 0 ? (
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {servicesList.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-base text-body-secondary">
                      <span className="size-1.5 shrink-0 rounded-full bg-footer-bar" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-base text-body-secondary">
                  This business has not listed specific services yet.
                </p>
              )}
            </section>
          </div>
        </div>

        {coverPhotos.length > 0 ? (
          <section className="mt-12 space-y-4 rounded-2xl border border-stat-muted bg-card-ice p-6 md:p-8">
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              Photos
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {coverPhotos.slice(0, 6).map((src, index) => {
                const isLastWithMore = index === 5 && coverPhotos.length > 6;
                const cell = (
                  <AspectCover
                    src={src}
                    className="aspect-4/3 w-full rounded-xl md:aspect-5/4 md:min-h-[200px]"
                  />
                );
                if (!isLastWithMore) {
                  return (
                    <button
                      key={`${src}-${index}`}
                      type="button"
                      className="w-full cursor-pointer overflow-hidden rounded-xl border-0 p-0 text-left outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-brand"
                      onClick={() => setPhotosOpen(true)}
                    >
                      {cell}
                    </button>
                  );
                }
                return (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    className="relative w-full cursor-pointer overflow-hidden rounded-xl border-0 p-0 text-left outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-brand"
                    onClick={() => setPhotosOpen(true)}
                  >
                    {cell}
                    <div className="pointer-events-none absolute inset-0 rounded-xl bg-black/30" aria-hidden />
                    <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-heading text-4xl font-semibold text-white drop-shadow-md">
                      +{coverPhotos.length - 5}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="mt-12 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-ink md:text-4xl">Service Area</h2>
            <button type="button" className="text-left text-sm font-semibold text-accent-foreground hover:underline sm:text-base">
              {locationText}
            </button>
          </div>
          <BusinessServiceAreaMap
            apiKey={env.googleMapsApiKey}
            businessName={name}
            locationLabel={locationText}
            latitude={latitude}
            longitude={longitude}
          />
        </section>

        <section ref={reviewsRef} className="mt-12 space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-ink md:text-4xl">
              Reviews{pagination.total > 0 && (
                <span className="ml-2 text-2xl text-stat-muted">({pagination.total})</span>
              )}
            </h2>
            <button
              type="button"
              onClick={handleWriteReview}
              className="border-b-2 border-accent-foreground/20 pb-0.5 text-left text-base font-semibold text-accent-foreground hover:opacity-90"
            >
              Write a review
            </button>
          </div>

          {reviewsList.length === 0 ? (
            <p className="text-base text-body-secondary">No reviews yet. Be the first to write one!</p>
          ) : (
            <>
              <div className="space-y-10">
                {reviewsList.map((review) => {
                  const initials = review.reviewer_name
                    .split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  const date = review.created_at
                    ? new Date(review.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })
                    : "";
                  return (
                    <article key={review.id} className="flex gap-6">
                      <div className="size-14 shrink-0 rounded-full ring-2 ring-border-light md:size-16 bg-primary/10 flex items-center justify-center">
                        <span className="text-base font-bold text-primary">{initials}</span>
                      </div>
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-ink">{review.reviewer_name}</p>
                          <p className="text-sm text-stat-muted">{date}</p>
                        </div>
                        <StarRow rating={review.rating} className="scale-90 origin-left" />
                        <p className="text-base leading-relaxed text-body-secondary">{review.review_text}</p>
                      </div>
                    </article>
                  );
                })}
              </div>

              {pagination.last_page > 1 && (
                <div className="flex items-center justify-between gap-4 border-t border-border-light pt-6">
                  <p className="text-sm text-stat-muted">
                    Page {pagination.current_page} of {pagination.last_page} &middot; {pagination.total} reviews
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={pagination.current_page === 1}
                      onClick={() => {
                        setReviewPage((p) => p - 1);
                        reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="rounded-lg border border-border-light px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Prev
                    </button>

                    {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === pagination.last_page ||
                          Math.abs(p - pagination.current_page) <= 1,
                      )
                      .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                        if (idx > 0 && (arr[idx - 1] as number) + 1 < p) acc.push("…");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === "…" ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-stat-muted">
                            …
                          </span>
                        ) : (
                          <button
                            key={item}
                            type="button"
                            onClick={() => {
                              setReviewPage(item);
                              reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }}
                            className={cn(
                              "rounded-lg border px-3 py-1.5 text-sm font-medium",
                              item === pagination.current_page
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border-light text-ink hover:bg-surface-soft",
                            )}
                          >
                            {item}
                          </button>
                        ),
                      )}

                    <button
                      type="button"
                      disabled={pagination.current_page === pagination.last_page}
                      onClick={() => {
                        setReviewPage((p) => p + 1);
                        reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="rounded-lg border border-border-light px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <ServicePhotosModal
        open={photosOpen}
        onClose={() => setPhotosOpen(false)}
        businessName={name}
        photos={coverPhotos}
      />

    </div>
  );
}
