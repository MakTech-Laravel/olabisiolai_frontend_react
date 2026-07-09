import { Link } from "react-router-dom";
import { ArrowLeft, BadgeCheck, CheckCircle2, Clock, Crown, MapPin, Sparkles, Star } from "lucide-react";

import { BusinessCatalogImage } from "@/components/business/BusinessCatalogImage";
import { DirectMessageButton } from "@/components/business/DirectMessageButton";
import { BusinessCatalogSection } from "@/components/business/BusinessCatalogSection";
import {
  BusinessActionsSkeleton,
  BusinessCatalogSkeleton,
  BusinessHeroSkeleton,
  BusinessHoursSkeleton,
  BusinessIdentityCardSkeleton,
  BusinessIdentitySkeleton,
  BusinessOverviewSkeleton,
  BusinessTrustSkeleton,
} from "@/components/business/BusinessPublicPageSkeleton";
import { BusinessPageShareReportRow } from "@/components/business/BusinessPageShareReportRow";
import { BusinessHoursDisplay } from "@/components/business/BusinessHoursDisplay";
import { BusinessSocialLinks } from "@/components/business/BusinessSocialLinks";
import { FollowVendorButton } from "@/components/business/FollowVendorButton";
import { PublicReviewCard } from "@/components/reviews/PublicReviewCard";
import { ShowPhoneNumberReveal } from "@/components/ShowPhoneNumberReveal";
import type { PublicBusiness } from "@/features/business/publicBusinessApi";
import type { SocialAccount } from "@/features/business/socialAccounts";
import type { PublicReview } from "@/features/reviews/publicReviewApi";
import { Button } from "@/components/ui/button";
import { NO_CATEGORY_LABEL, NO_LOCATION_LABEL } from "@/features/business/publicBusinessApi";
import { displayBusinessOverview } from "@/constants/businessOverview";
import { buildGoogleMapsSearchUrl } from "@/lib/googleMapsUrl";
import {
  businessPageBody,
  businessPageHero,
  businessPageIdentityCard,
  businessPageOuter,
  businessPagePhotoGrid,
  businessPageSectionTitle,
  businessPageSectionX,
  businessPageSidebar,
  businessPageTitle,
} from "@/lib/businessPageLayout";
import { cn } from "@/lib/utils";
import type { BusinessCatalogItem } from "@/features/catalog/businessCatalogApi";

function StarRow({ rating = 0, className, size = "md" }: { rating?: number; className?: string; size?: "sm" | "md" }) {
  const clamped = Math.min(5, Math.max(0, rating));
  const starClass = size === "sm" ? "size-[15px]" : "size-[18px] lg:size-5";
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${clamped.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const diff = clamped - (i - 1);
        if (diff >= 1) {
          return <Star key={i} className={cn(starClass, "shrink-0 fill-brand-red text-brand-red")} aria-hidden />;
        }
        if (diff > 0) {
          const pct = Math.round(diff * 100);
          return (
            <span key={i} className={cn("relative inline-flex shrink-0", starClass)}>
              <Star className={cn(starClass, "fill-brand-red/20 text-brand-red/40")} aria-hidden />
              <span className="absolute left-0 top-0 h-full overflow-hidden" style={{ width: `${pct}%` }}>
                <Star className={cn(starClass, "fill-brand-red text-brand-red")} aria-hidden />
              </span>
            </span>
          );
        }
        return (
          <Star key={i} className={cn(starClass, "shrink-0 fill-brand-red/20 text-brand-red/40")} aria-hidden />
        );
      })}
    </div>
  );
}

type BusinessPublicPageViewProps = {
  backTo: string;
  pathname: string;
  businessId: number;
  business: PublicBusiness | null | undefined;
  businessFetching: boolean;
  businessFetched: boolean;
  name: string;
  categoryLabel: string;
  categoryId?: number | null;
  subcategoryLabel: string | null;
  description: string;
  locationText: string;
  latitude: number | null;
  longitude: number | null;
  rating: number;
  reviewCount: number;
  verified: boolean;
  memberSince: string | null;
  responseTimeLabel: string | null;
  followersCount: number;
  isFollowingVendor: boolean;
  vendorUserId: number | null;
  vendorUserUuid: string | null;
  boostActive: boolean;
  isPremium: boolean;
  heroCover: string;
  logoUrl?: string | null;
  coverPhotos: string[];
  photoLimit: number;
  contactPhone: string | null;
  whatsappUrl: string | null;
  website?: string | null;
  socialAccounts: SocialAccount[];
  catalogItems: BusinessCatalogItem[];
  catalogLocked: boolean;
  showCatalogSection: boolean;
  showCustomerActions: boolean;
  capabilities: {
    follow: boolean;
    message: boolean;
    report: boolean;
    review: boolean;
  };
  reviewsRef: React.RefObject<HTMLElement | null>;
  reviewsList: PublicReview[];
  reviewsLoading?: boolean;
  pagination: { current_page: number; last_page: number; total: number };
  seeAllReviewsHref?: string;
  showDirectMessage?: boolean;
  onFollowersChange: (count: number, following?: boolean) => void;
  onOpenPhotos: () => void;
  onOpenPhotoAt: (index: number) => void;
  onWriteReview: () => void;
  hideBackLink?: boolean;
};

export function BusinessPublicPageView(props: BusinessPublicPageViewProps) {
  const {
    backTo,
    pathname,
    businessId,
    business,
    businessFetching,
    businessFetched,
    name,
    categoryLabel,
    categoryId,
    subcategoryLabel,
    description,
    locationText,
    latitude,
    longitude,
    rating,
    reviewCount,
    verified,
    memberSince,
    responseTimeLabel,
    followersCount,
    isFollowingVendor,
    vendorUserId,
    vendorUserUuid,
    boostActive,
    isPremium,
    heroCover,
    logoUrl,
    coverPhotos,
    contactPhone,
    whatsappUrl,
    website,
    socialAccounts,
    catalogItems,
    catalogLocked,
    showCatalogSection,
    showCustomerActions,
    capabilities,
    reviewsRef,
    reviewsList,
    reviewsLoading = false,
    pagination,
    seeAllReviewsHref,
    showDirectMessage = false,
    onFollowersChange,
    onOpenPhotos,
    onOpenPhotoAt,
    onWriteReview,
    hideBackLink = false,
  } = props;

  const ratingScore = rating > 0 ? (Number.isInteger(rating) ? String(rating) : rating.toFixed(1)) : null;
  const categoryIsPlaceholder = categoryLabel === NO_CATEGORY_LABEL;
  const locationIsPlaceholder = locationText === NO_LOCATION_LABEL;
  const isPageLoading = businessFetching && !businessFetched;
  const hasIdentityDetails = Boolean(
    name.trim() || locationText.trim() || categoryLabel.trim() || subcategoryLabel?.trim() || rating > 0,
  );
  const hasOverview = Boolean(displayBusinessOverview(description));

  const actionsPanel = showCustomerActions ? (
    isPageLoading ? (
      <BusinessActionsSkeleton />
    ) : (
      <section className="flex flex-col gap-2.5 md:gap-3">
        <ShowPhoneNumberReveal
          useShadcnButton
          isolateFromParentClicks={false}
          phoneNumber={contactPhone}
          className="h-auto w-full rounded-[14px] bg-brand-red px-4 py-[15px] text-[15.5px] font-semibold text-white shadow-[0_8px_18px_rgba(225,36,42,0.24)] transition-transform hover:bg-brand-red/90 active:scale-[0.99] lg:text-base"
          iconClassName="size-[19px] shrink-0"
        />
        {showDirectMessage ? (
          <DirectMessageButton
            businessInfoId={businessId}
            vendorUserUuid={vendorUserUuid}
            fromPath={pathname}
            className="h-auto w-full rounded-[14px] border-0 bg-chat-accent px-4 py-[15px] text-[15.5px] font-semibold text-white shadow-[0_8px_18px_rgba(28,134,232,0.24)] transition-transform hover:bg-chat-accent/90 active:scale-[0.99] lg:text-base"
            iconClassName="size-[19px] shrink-0"
          />
        ) : null}
        {whatsappUrl ? (
          <Button
            asChild
            variant="outline"
            className="h-auto w-full rounded-[14px] border-[1.5px] border-[#c4eccf] bg-white px-4 py-[15px] text-[15.5px] font-semibold text-[#1FAF54] transition-transform hover:bg-[#f0fbf3] active:scale-[0.99] lg:text-base"
          >
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2.5">
              <svg className="size-[19px] shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Chat via WhatsApp
            </a>
          </Button>
        ) : null}
        <BusinessPageShareReportRow
          businessId={businessId}
          businessName={name}
          listingPath={pathname}
          allowReport={capabilities.report}
        />
      </section>
    )
  ) : null;

  const trustPanel =
    isPageLoading && showCustomerActions ? (
      <BusinessTrustSkeleton />
    ) : (memberSince || responseTimeLabel) && showCustomerActions ? (
      <div className="rounded-2xl bg-white px-4 shadow-sm lg:px-5">
        {memberSince ? (
          <p className="flex items-center gap-3 border-b border-border-light py-3.5 text-sm font-medium text-ink lg:text-[15px]">
            <CheckCircle2 className="size-5 shrink-0 text-chat-accent" aria-hidden />
            Gidira member since {memberSince}
          </p>
        ) : null}
        <p className="flex items-center gap-3 py-3.5 text-sm font-medium text-ink lg:text-[15px]">
          <Clock className="size-5 shrink-0 text-chat-accent" aria-hidden />
          {responseTimeLabel ?? "Usually responds within 15 minutes"}
        </p>
      </div>
    ) : null;

  const hoursPanel =
    isPageLoading ? (
      <BusinessHoursSkeleton />
    ) : businessFetched && business ? (
      <BusinessHoursDisplay
        hours={business.businessHours}
        displayRows={business.businessHoursDisplay}
        title=""
        className="rounded-2xl border-0 bg-[#EAF2FD] px-[18px] py-1 lg:py-2"
      />
    ) : null;

  const socialPanel =
    socialAccounts.length > 0 || website?.trim() ? (
      <BusinessSocialLinks accounts={socialAccounts} website={website} title="" className="border-0 p-0" />
    ) : null;

  const showSeeAllReviews =
    Boolean(seeAllReviewsHref) &&
    (pagination.total > reviewsList.length || pagination.last_page > 1 || reviewCount > reviewsList.length);
  const showReviewsSection = businessFetched && !isPageLoading;

  const sidebarContent = (
    <>
      {actionsPanel ? (
        <div className="rounded-3xl border border-border-light bg-card p-5 shadow-xl lg:p-6">{actionsPanel}</div>
      ) : null}
      {trustPanel}
      {hoursPanel ? (
        <div>
          <h2 className={cn(businessPageSectionTitle, "mb-3 hidden lg:block")}>Business hours</h2>
          {hoursPanel}
        </div>
      ) : null}
    </>
  );

  return (
    <div className={businessPageOuter}>
      {!hideBackLink ? (
        <div className={cn(businessPageSectionX, "pb-1 lg:pb-3")}>
          <Link
            to={backTo}
            className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-chat-accent hover:underline lg:text-base"
          >
            <ArrowLeft className="size-5 shrink-0" strokeWidth={2} aria-hidden />
            Back
          </Link>
        </div>
      ) : null}

      <div className="lg:flex lg:items-start lg:gap-10 xl:gap-12">
        <div className="min-w-0 flex-1">
          <div className={cn("relative", businessPageSectionX)}>
            {isPageLoading ? (
              <BusinessHeroSkeleton />
            ) : (
              <>
                <BusinessCatalogImage
                  src={heroCover}
                  alt={`${name} cover photo`}
                  className={businessPageHero}
                  aspectClassName="aspect-[4/3] w-full max-h-[min(540px,72vh)]"
                  priority
                  onClick={() => onOpenPhotoAt(0)}
                />
                <div className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-black/5 lg:rounded-2xl" aria-hidden />
                {isPremium ? (
                  <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-[#9A6B1F] to-[#C99A3F] px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-[0_4px_12px_rgba(154,107,31,0.4)] lg:left-5 lg:top-5">
                    <Crown className="size-3 fill-white" aria-hidden />
                    Premium
                  </span>
                ) : boostActive ? (
                  <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-[#9A6B1F] to-[#C99A3F] px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white lg:left-5 lg:top-5">
                    <Sparkles className="size-3" aria-hidden />
                    Boosted
                  </span>
                ) : null}
                {coverPhotos.length > 1 ? (
                  <button
                    type="button"
                    className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 transition-opacity hover:opacity-90 lg:bottom-5 lg:left-5"
                    onClick={onOpenPhotos}
                    aria-label={`View all ${coverPhotos.length} photos`}
                  >
                    {coverPhotos.slice(1, 3).map((src, index) => (
                      <span
                        key={`${src}-thumb-${index}`}
                        className="size-[46px] overflow-hidden rounded-[11px] border-2 border-white shadow-[0_2px_8px_rgba(0,0,0,0.3)] lg:size-[52px]"
                      >
                        <img src={src} alt="" className="size-full object-contain" loading="lazy" />
                      </span>
                    ))}
                    {coverPhotos.length > 3 ? (
                      <span className="flex size-[46px] items-center justify-center rounded-[11px] border-2 border-white bg-[rgba(15,22,32,0.6)] text-[13px] font-bold text-white backdrop-blur-[2px] lg:size-[52px]">
                        +{coverPhotos.length - 3}
                      </span>
                    ) : null}
                  </button>
                ) : null}
                {coverPhotos.length > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="absolute bottom-4 right-4 z-10 rounded-full border-0 bg-white px-4 py-2 text-[13.5px] font-semibold text-chat-accent shadow-md transition-transform hover:bg-white active:scale-[0.98] lg:bottom-5 lg:right-5"
                    onClick={onOpenPhotos}
                  >
                    See all photos
                  </Button>
                ) : null}
              </>
            )}
          </div>

          {isPageLoading ? (
            <div className={cn("mt-4", businessPageSectionX)}>
              <BusinessIdentityCardSkeleton />
            </div>
          ) : (
            <section
              className={cn("mt-4", businessPageSectionX, businessPageIdentityCard)}
              aria-busy={false}
            >
              <div className="relative mb-3 flex size-16 items-center justify-center overflow-hidden rounded-[18px] bg-gradient-to-br from-[#1C86E8] to-[#1B4FD8] shadow-sm lg:size-20 lg:rounded-2xl">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="font-heading text-2xl font-bold text-white lg:text-3xl">
                    {name.trim().charAt(0).toUpperCase() || "B"}
                  </span>
                )}
              </div>
              {!hasIdentityDetails ? (
                <div className="mt-1">
                  <BusinessIdentitySkeleton />
                </div>
              ) : (
                <>
                  {name.trim() ? <h1 className={businessPageTitle}>{name}</h1> : null}
                  {locationText ? (
                    <p className="mt-2 flex items-start gap-1.5 text-[13.5px] text-body-secondary lg:text-base">
                      <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                      {locationIsPlaceholder ? (
                        <span className="italic text-stat-muted">{locationText}</span>
                      ) : (
                        <a
                          href={buildGoogleMapsSearchUrl(latitude, longitude, locationText)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {locationText}
                        </a>
                      )}
                    </p>
                  ) : null}
                  {capabilities.follow && vendorUserId ? (
                    <div className="mt-2.5 flex items-center justify-between gap-3">
                      <p className="text-sm text-body-secondary lg:text-base">
                        <span className="font-bold text-ink">{followersCount.toLocaleString()}</span> followers
                      </p>
                      <FollowVendorButton
                        businessId={businessId}
                        followingUserId={vendorUserId}
                        initialFollowing={isFollowingVendor}
                        listingPath={pathname}
                        variant="pill"
                        onFollowChange={(following, count) => {
                          if (typeof count === "number") onFollowersChange(count);
                          else onFollowersChange(followersCount + (following ? 1 : -1), following);
                        }}
                      />
                    </div>
                  ) : followersCount > 0 ? (
                    <p className="mt-2 text-sm text-body-secondary lg:text-base">
                      <span className="font-bold text-ink">{followersCount.toLocaleString()}</span> followers
                    </p>
                  ) : null}
                  {categoryLabel || subcategoryLabel ? (
                    <p className="mt-3 text-sm leading-relaxed text-ink lg:text-base">
                      {categoryLabel ? (
                        <>
                          Category:{" "}
                          {categoryIsPlaceholder || !categoryId ? (
                            <span className="font-semibold italic text-stat-muted">{categoryLabel}</span>
                          ) : (
                            <Link
                              to={`/filters?category_id=${categoryId}`}
                              className="font-semibold text-chat-accent hover:underline"
                            >
                              {categoryLabel}
                            </Link>
                          )}
                        </>
                      ) : null}
                      {categoryLabel && subcategoryLabel ? <span> · </span> : null}
                      {subcategoryLabel ? (
                        categoryId ? (
                          <Link
                            to={`/filters?category_id=${categoryId}&subcategory=${encodeURIComponent(subcategoryLabel)}`}
                            className="font-semibold text-chat-accent hover:underline"
                          >
                            {subcategoryLabel}
                          </Link>
                        ) : (
                          <span className="font-semibold text-chat-accent">{subcategoryLabel}</span>
                        )
                      ) : null}
                    </p>
                  ) : null}
                  <div className="mt-3.5 flex flex-wrap items-center gap-2.5 text-sm font-semibold text-ink lg:text-base">
                    {rating > 0 ? <StarRow rating={rating} /> : null}
                    {ratingScore ? <span>{ratingScore}</span> : null}
                    {reviewCount > 0 ? (
                      <span className="font-normal text-stat-muted">
                        · {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
                      </span>
                    ) : null}
                    {verified ? (
                      <>
                        <span className="text-stat-muted">·</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-chat-accent">
                          <BadgeCheck className="size-4 shrink-0" aria-hidden />
                          Verified
                        </span>
                      </>
                    ) : null}
                    {capabilities.review ? (
                      <>
                        <span className="text-stat-muted">·</span>
                        <button
                          type="button"
                          onClick={onWriteReview}
                          className="font-semibold text-chat-accent hover:underline"
                        >
                          Write a review
                        </button>
                      </>
                    ) : null}
                  </div>
                </>
              )}
            </section>
          )}

          {!isPageLoading ? (
            <div className={cn("lg:hidden", businessPageSectionX, "pt-[18px]")}>
              {actionsPanel}
              {trustPanel ? <div className="mt-4">{trustPanel}</div> : null}
            </div>
          ) : null}

          <section className={cn("pt-6", businessPageSectionX)}>
            <h2 className={businessPageSectionTitle}>Overview</h2>
            {isPageLoading && !hasOverview ? (
              <div className="mt-2">
                <BusinessOverviewSkeleton />
              </div>
            ) : (
              <p className={cn("mt-2 break-words", businessPageBody)}>
                {displayBusinessOverview(description) || "No description available."}
              </p>
            )}
          </section>

          {showCatalogSection ? (
            <section className={cn("pt-6", businessPageSectionX)}>
              {isPageLoading ? (
                <BusinessCatalogSkeleton />
              ) : (
                <BusinessCatalogSection
                  items={catalogItems}
                  catalogLocked={catalogLocked}
                  businessId={businessId}
                  businessName={name}
                  vendorUserUuid={vendorUserUuid}
                  fromPath={pathname}
                  showMessageBusiness={showDirectMessage && capabilities.message}
                  messagesPath="/messages"
                  className="space-y-3 [&_h2]:text-[21px] [&_h2]:lg:text-3xl [&_p]:text-[14.5px] [&_p]:lg:text-base"
                />
              )}
            </section>
          ) : null}

          {coverPhotos.length > 0 && !isPageLoading ? (
            <section className={cn("pt-6", businessPageSectionX)}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className={businessPageSectionTitle}>Photos</h2>
              </div>
              <div className={businessPagePhotoGrid}>
                {coverPhotos.slice(0, 5).map((src, index) => (
                  <BusinessCatalogImage
                    key={`${src}-${index}`}
                    src={src}
                    alt={`${name} photo ${index + 1}`}
                    className="rounded-[13px] lg:rounded-xl"
                    onClick={() => onOpenPhotoAt(index)}
                  />
                ))}
                {coverPhotos.length > 5 ? (
                  <button
                    type="button"
                    className="grid place-items-center rounded-[13px] bg-[#dfe5ee] text-[15px] font-bold text-body-secondary transition-colors hover:bg-[#d0d8e4] lg:rounded-xl"
                    onClick={onOpenPhotos}
                  >
                    +{coverPhotos.length - 5}
                  </button>
                ) : null}
              </div>
            </section>
          ) : null}

          <div className={cn("lg:hidden", businessPageSectionX, "pt-6")}>
            {hoursPanel ? (
              <>
                <h2 className={businessPageSectionTitle}>Business hours</h2>
                <div className="mt-3.5">{hoursPanel}</div>
              </>
            ) : null}
          </div>


          {showReviewsSection ? (
            <section ref={reviewsRef} className={cn("pt-6", businessPageSectionX)}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className={businessPageSectionTitle}>Customer reviews</h2>
                {rating > 0 ? (
                  <div className="flex items-center gap-2 text-sm text-body-secondary">
                    <StarRow rating={rating} size="sm" />
                    <span className="font-semibold text-ink">
                      {ratingScore ?? rating.toFixed(1)}
                    </span>
                    {reviewCount > 0 ? (
                      <span>
                        · {reviewCount.toLocaleString()} {reviewCount === 1 ? "review" : "reviews"}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="rounded-2xl border border-border-light bg-white px-5 shadow-sm">
                {reviewsLoading ? (
                  <div className="space-y-5 py-5">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="animate-pulse border-b border-border-light py-5 last:border-b-0">
                        <div className="flex gap-3">
                          <div className="size-11 shrink-0 rounded-full bg-muted" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 rounded bg-muted" />
                            <div className="h-3 w-24 rounded bg-muted" />
                            <div className="h-3 w-full rounded bg-muted" />
                            <div className="h-3 w-4/5 rounded bg-muted" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : reviewsList.length > 0 ? (
                  reviewsList.map((review) => (
                    <PublicReviewCard
                      key={review.id}
                      review={review}
                      businessName={name}
                      listingPath={pathname}
                      showActions={false}
                    />
                  ))
                ) : (
                  <p className="py-8 text-center text-sm text-body-secondary">
                    No reviews yet.{" "}
                    {capabilities.review ? (
                      <button
                        type="button"
                        onClick={onWriteReview}
                        className="font-semibold text-chat-accent hover:underline"
                      >
                        Be the first to write one
                      </button>
                    ) : (
                      "Check back later."
                    )}
                  </p>
                )}
              </div>
              {showSeeAllReviews && seeAllReviewsHref ? (
                <div className="mt-4 flex justify-center">
                  <Button asChild variant="outline" className="rounded-full px-6 font-semibold">
                    <Link to={seeAllReviewsHref}>See all reviews</Link>
                  </Button>
                </div>
              ) : null}
            </section>
          ) : null}

          {socialPanel ? (
            <section className={cn("pb-4 pt-6", businessPageSectionX)}>
              <h2 className={cn(businessPageSectionTitle, "mb-3")}>Find us online</h2>
              <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm">{socialPanel}</div>
            </section>
          ) : null}
        </div>

        <aside className={cn(businessPageSidebar, "hidden lg:block")}>{sidebarContent}</aside>
      </div>
    </div>
  );
}
