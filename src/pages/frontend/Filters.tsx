import { FiltersResultsMap, type MapBusinessPin } from "@/components/maps/FiltersResultsMap";
import FiltersSection from "@/components/sections/filters/FiltersSection";
import ServiceCard from "@/components/sections/filters/ServiceCard";
import { env } from "@/config/env";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCategoryCatalog } from "@/features/categories/useCategoryCatalog";
import { useLocationCatalog } from "@/features/locations/useLocationCatalog";
import { fetchPublicBusinessesPage, type PublicBusiness } from "@/features/business/publicBusinessApi";
import { DEFAULT_GEO_SEARCH_RADIUS_KM } from "@/features/maps/geoMapTypes";
import { ChevronLeft, Loader2, Map as MapIcon, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { router } from "@/routes/router";

function parseCoord(raw: string | null): number | null {
  if (raw == null || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function hasGeoSearchParams(searchParams: URLSearchParams): boolean {
  return searchParams.has("lat") && searchParams.has("lng");
}

const fallbackBusiness = (
  id: number,
  name: string,
  category: string,
  location: string,
  image: string,
): PublicBusiness => ({
  id,
  name,
  category,
  location,
  rating: 4.8,
  reviews: 100,
  description: "",
  image,
  logoUrl: image,
  coverPhotoUrls: [image],
  servicesOffered: [],
  verified: true,
  memberSince: null,
  verifiedSince: null,
  socialAccounts: [],
  isFavorite: false,
  boostStatus: 'none',
  isPremium: false,
  vendorUserId: null,
  vendorUserUuid: null,
  businessHours: [],
  businessHoursDisplay: [],
});

const FALLBACK_BUSINESSES: PublicBusiness[] = [
  fallbackBusiness(1, "Premium Plumbing Services", "Plumbing", "Lagos, Ikeja", "/images/feature/1.jpg"),
  fallbackBusiness(2, "Sparkle Clean Services", "Cleaning", "Lagos, Surulere", "/images/feature/1-1.jpg"),
  fallbackBusiness(3, "Elite Electrical Solutions", "Electrical", "Lagos, Victoria Island", "/images/feature/1-2.jpg"),
  fallbackBusiness(4, "Glamour Beauty Spa", "Beauty & Spa", "Lagos, Lekki", "/images/feature/1-3.jpg"),
];

const FILTERS_BASE_PATH = "/filters";

export default function Filters() {
  const queryClient = useQueryClient();
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryIdParam = searchParams.get("category_id");
  const categoryNameParam = (searchParams.get("category") ?? "").trim();
  const subcategoryParam = (searchParams.get("subcategory") ?? "").trim();
  const searchTerm = (searchParams.get("search") ?? "").trim();
  const verifiedOnly = searchParams.get("verified") === "1";
  const locationRaw = Number(searchParams.get("location_id") ?? "");
  const selectedLocationId = Number.isFinite(locationRaw) && locationRaw > 0 ? locationRaw : null;
  const ratingRaw = Number(searchParams.get("rating") ?? "");
  const selectedMinRating = Number.isFinite(ratingRaw) && ratingRaw >= 1 && ratingRaw <= 5 ? ratingRaw : null;
  const pageRaw = Number(searchParams.get("page") ?? "");
  const currentPage = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const mapLat = parseCoord(searchParams.get("lat"));
  const mapLng = parseCoord(searchParams.get("lng"));
  const mapPlaceLabel = (searchParams.get("place") ?? "").trim();
  const radiusRaw = Number(searchParams.get("radius_km") ?? DEFAULT_GEO_SEARCH_RADIUS_KM);
  const geoRadiusKm =
    Number.isFinite(radiusRaw) && radiusRaw >= 1 && radiusRaw <= 200
      ? radiusRaw
      : DEFAULT_GEO_SEARCH_RADIUS_KM;
  const hasGeoSearch =
    hasGeoSearchParams(searchParams) && mapLat !== null && mapLng !== null;
  const mapCenter = hasGeoSearch ? { lat: mapLat, lng: mapLng } : null;

  const { data: apiCategories = [], isPending: categoriesLoading } = useCategoryCatalog();
  const { data: catalogLocations = [] } = useLocationCatalog();
  const perPage = 10;

  /**
   * Category filter from URL — must NOT wait for `apiCategories` to load.
   * Otherwise the first API call runs without `category_id` and wrong cards appear
   * while the sidebar still shows the selected category.
   */
  const filterCategoryId = useMemo<number | null>(() => {
    const rawId = Number(categoryIdParam ?? "");
    if (Number.isFinite(rawId) && rawId > 0) {
      return rawId;
    }
    if (categoryNameParam && apiCategories.length > 0) {
      const byName = apiCategories.find((c) => c.name === categoryNameParam);
      if (byName) return byName.id;
    }
    return null;
  }, [categoryIdParam, categoryNameParam, apiCategories]);

  const filterCategoryName = useMemo(() => {
    if (filterCategoryId == null) return null;
    return apiCategories.find((c) => c.id === filterCategoryId)?.name ?? null;
  }, [apiCategories, filterCategoryId]);

  const subcategoryOptions = useMemo(() => {
    if (filterCategoryId == null) return [];
    const category = apiCategories.find((c) => c.id === filterCategoryId);
    return category?.subcategories ?? [];
  }, [apiCategories, filterCategoryId]);

  const filterSubcategory = useMemo<string | null>(() => {
    if (!subcategoryParam) return null;
    if (subcategoryOptions.length === 0) return subcategoryParam;
    return subcategoryOptions.includes(subcategoryParam) ? subcategoryParam : null;
  }, [subcategoryParam, subcategoryOptions]);

  const businessesQuery = useQuery({
    queryKey: [
      "filters",
      filterCategoryId,
      filterSubcategory,
      selectedLocationId,
      searchTerm,
      verifiedOnly,
      currentPage,
      perPage,
      mapLat,
      mapLng,
      geoRadiusKm,
    ],
    queryFn: () =>
      fetchPublicBusinessesPage({
        category_id: filterCategoryId ?? undefined,
        subcategory: filterSubcategory ?? undefined,
        location_id: selectedLocationId ?? undefined,
        lat: mapLat ?? undefined,
        lng: mapLng ?? undefined,
        radius_km: hasGeoSearch ? geoRadiusKm : undefined,
        search: searchTerm || undefined,
        verification_status: verifiedOnly ? "approved" : undefined,
        page: currentPage,
        per_page: perPage,
      }),
    staleTime: 60_000,
  });
  const businesses = useMemo<PublicBusiness[]>(() => {
    if (businessesQuery.isError) {
      const hasActiveFilters =
        filterCategoryId != null ||
        selectedLocationId != null ||
        hasGeoSearch ||
        searchTerm.length > 0 ||
        verifiedOnly;
      return hasActiveFilters ? [] : FALLBACK_BUSINESSES;
    }
    return businessesQuery.data?.items ?? [];
  }, [
    businessesQuery.data?.items,
    businessesQuery.isError,
    filterCategoryId,
    selectedLocationId,
    hasGeoSearch,
    searchTerm,
    verifiedOnly,
  ]);
  const businessesLoading = businessesQuery.isPending;

  const handleSelectCategory = (categoryId: number | null) => {
    const next = new URLSearchParams(searchParams);
    if (categoryId == null) {
      next.delete("category_id");
      next.delete("category");
    } else {
      next.set("category_id", String(categoryId));
      next.delete("category");
    }
    next.delete("subcategory");
    next.delete("page");
    setSearchParams(next, { replace: true });
  };

  const handleSelectSubcategory = (subcategory: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!subcategory) next.delete("subcategory");
    else next.set("subcategory", subcategory);
    next.delete("page");
    setSearchParams(next, { replace: true });
  };

  const handleSelectLocation = (locationId: number | null) => {
    const next = new URLSearchParams(searchParams);
    if (locationId === null) next.delete("location_id");
    else next.set("location_id", String(locationId));
    next.delete("page");
    setSearchParams(next, { replace: true });
  };

  const handleSearchTermChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value.trim()) next.delete("search");
    else next.set("search", value.trim());
    next.delete("page");
    setSearchParams(next, { replace: true });
  };

  const handleVerifiedOnlyChange = (value: boolean) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete("verified");
    else next.set("verified", "1");
    next.delete("page");
    setSearchParams(next, { replace: true });
  };

  const handleSelectMinRating = (rating: number | null) => {
    const next = new URLSearchParams(searchParams);
    if (rating === null) next.delete("rating");
    else next.set("rating", String(rating));
    next.delete("page");
    setSearchParams(next, { replace: true });
  };

  const visibleBusinesses = useMemo(() => {
    return businesses.filter((business) => {
      if (filterCategoryId != null) {
        const rawBid = business.categoryId;
        const bid =
          rawBid != null && Number.isFinite(Number(rawBid)) ? Number(rawBid) : NaN;
        if (Number.isFinite(bid)) {
          if (bid !== filterCategoryId) return false;
        } else if (filterCategoryName != null) {
          if (
            business.category.trim().toLowerCase() !==
            filterCategoryName.trim().toLowerCase()
          ) {
            return false;
          }
        } else {
          // URL has category_id but row has no numeric id and catalog name unknown — drop row
          return false;
        }
      }
      if (filterSubcategory != null) {
        const rowSub = (business.subcategory ?? "").trim();
        if (rowSub !== filterSubcategory) return false;
      }
      if (selectedLocationId != null) {
        if (business.locationId != null && business.locationId !== selectedLocationId) {
          return false;
        }
      }
      if (selectedMinRating !== null && business.rating < selectedMinRating) return false;
      return true;
    });
  }, [
    businesses,
    filterCategoryId,
    filterCategoryName,
    filterSubcategory,
    selectedLocationId,
    selectedMinRating,
  ]);

  /** Full list from `GET /locations` so options do not collapse when `location_id` filters API results. */
  const locationOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const opt of catalogLocations) {
      map.set(opt.id, opt.label);
    }
    for (const business of businesses) {
      if (!business.locationId) continue;
      const label = (business.locationName || business.location).trim();
      if (!map.has(business.locationId) && label) {
        map.set(business.locationId, label);
      }
    }
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [catalogLocations, businesses]);

  const mapPins = useMemo<MapBusinessPin[]>(() => {
    return visibleBusinesses
      .filter(
        (b) =>
          b.latitude != null &&
          b.longitude != null &&
          Number.isFinite(b.latitude) &&
          Number.isFinite(b.longitude),
      )
      .map((b) => ({
        id: b.id,
        name: b.name,
        lat: b.latitude as number,
        lng: b.longitude as number,
      }));
  }, [visibleBusinesses]);

  const mapFallbackQuery = useMemo(() => {
    if (mapPlaceLabel) return mapPlaceLabel;
    if (mapCenter) return `${mapCenter.lat},${mapCenter.lng}`;
    if (visibleBusinesses[0]) return visibleBusinesses[0].location;
    if (selectedLocationId) {
      const option = locationOptions.find((opt) => opt.id === selectedLocationId);
      if (option) return option.label;
    }
    return "Nigeria";
  }, [mapPlaceLabel, mapCenter, visibleBusinesses, selectedLocationId, locationOptions]);

  useEffect(() => {
    if (hasGeoSearch && searchParams.get("map") === "1") {
      setShowMap(true);
    }
  }, [hasGeoSearch, searchParams]);

  const totalPages = Math.max(1, businessesQuery.data?.lastPage ?? 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const showPagination = totalPages > 1;

  const hasActiveFilters = useMemo(() => {
    const hasCategoryInUrl =
      Boolean(categoryIdParam?.trim()) || categoryNameParam.length > 0;
    return (
      hasCategoryInUrl ||
      searchTerm.length > 0 ||
      verifiedOnly ||
      selectedLocationId != null ||
      hasGeoSearch ||
      selectedMinRating != null ||
      filterSubcategory != null ||
      currentPage > 1
    );
  }, [
    categoryIdParam,
    categoryNameParam,
    filterSubcategory,
    searchTerm,
    verifiedOnly,
    selectedLocationId,
    hasGeoSearch,
    selectedMinRating,
    currentPage,
  ]);

  const onResetFiltersClick = useCallback(
    (event?: { preventDefault?: () => void }) => {
      event?.preventDefault?.();
      setShowFilters(false);
      setShowMap(false);
      void queryClient.cancelQueries({ queryKey: ["filters"] });
      void queryClient.removeQueries({ queryKey: ["filters"] });
      // RR v7 + createBrowserRouter: imperative navigate clears ?lat=&lng= on same path.
      void router.navigate(FILTERS_BASE_PATH, { replace: true });
      setSearchParams("", { replace: true });
    },
    [queryClient, setSearchParams],
  );

  return (
    <div key={searchParams.toString() || "default"} className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm px-4 py-4 sm:px-6">
        <div className="container mx-auto px-2 sm:px-4">
          <Link
            to="/"
            className="flex items-center font-inter font-normal text-base text-primary hover:text-primary/80"
          >
            <ChevronLeft size={20} className="mr-1" />
            Back to Home
          </Link>
          <h1 className="text-2xl sm:text-3xl font-inter font-bold text-text-primary mt-4">
            {searchTerm ? "Search results" : "All Business"}
          </h1>
          <p className="text-text-secondary font-inter font-normal text-sm sm:text-base mt-2">
            {hasGeoSearch
              ? `Showing businesses within ${geoRadiusKm} km of ${mapPlaceLabel || "your selected point"}`
              : searchTerm
                ? `Showing businesses matching "${searchTerm}"`
                : filterCategoryName
                  ? filterSubcategory
                    ? `Showing ${filterSubcategory} in ${filterCategoryName}`
                    : `Showing businesses in ${filterCategoryName}`
                  : "Browse and filter businesses by category, location, and more"}
          </p>
        </div>
      </div>

      {/* Mobile Action Bar — visible only on mobile */}
      <div className="lg:hidden flex items-center gap-2 px-4 py-3 bg-card border-b border-border sticky top-0 z-20">
        <button
          onClick={() => setShowFilters(true)}
          className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm font-medium text-text-primary hover:bg-muted"
        >
          <SlidersHorizontal size={16} />
          Filters
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onResetFiltersClick()}
            className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-primary hover:bg-muted"
            aria-label="Reset filters"
          >
            <span className="inline-flex items-center gap-1.5">
              <RotateCcw size={16} className="shrink-0" aria-hidden />
              Reset
            </span>
          </button>
        )}
        <button
          onClick={() => setShowMap(true)}
          className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm font-medium text-text-primary hover:bg-muted"
        >
          <MapIcon size={16} />
          View Map
        </button>
      </div>

      {/* Mobile Filters Drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowFilters(false)}
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 w-[min(100vw-2rem,24rem)] max-w-[85vw] bg-background overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background z-10">
              <span className="font-inter font-semibold text-text-primary text-lg">
                Filters
              </span>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 rounded-md hover:bg-muted"
                aria-label="Close filters"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>
            <div className="p-3 sm:p-4">
              <FiltersSection
                key={searchParams.toString() || "default"}
                radioGroupId="filters-mobile-drawer"
                layout="drawer"
                categories={apiCategories}
                selectedCategoryId={filterCategoryId}
                onSelectCategory={handleSelectCategory}
                subcategoryOptions={subcategoryOptions}
                selectedSubcategory={filterSubcategory}
                onSelectSubcategory={handleSelectSubcategory}
                locationOptions={locationOptions}
                selectedLocationId={selectedLocationId}
                onSelectLocation={handleSelectLocation}
                searchTerm={searchTerm}
                onSearchTermChange={handleSearchTermChange}
                verifiedOnly={verifiedOnly}
                onVerifiedOnlyChange={handleVerifiedOnlyChange}
                selectedMinRating={selectedMinRating}
                onSelectMinRating={handleSelectMinRating}
                categoriesLoading={categoriesLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Map Drawer */}
      {showMap && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowMap(false)}
          />
          {/* Drawer from bottom */}
          <div className="absolute left-0 right-0 bottom-0 h-full bg-background rounded-t-2xl overflow-hidden shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border bg-background z-10">
              <span className="font-inter font-semibold text-text-primary text-lg">
                Map View
              </span>
              <button
                onClick={() => setShowMap(false)}
                className="p-1 rounded-md hover:bg-muted"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>
            <div className="h-[calc(100%-4rem)]">
              {mapCenter ? (
                <FiltersResultsMap
                  apiKey={env.googleMapsApiKey}
                  center={mapCenter}
                  centerLabel={mapPlaceLabel || undefined}
                  businesses={mapPins}
                  className="h-full w-full"
                />
              ) : (
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(mapFallbackQuery)}&t=&z=12&ie=UTF8&iwloc=&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto flex min-w-0 flex-col gap-6 px-3 py-4 sm:px-4 sm:py-6 lg:flex-row lg:px-4 lg:py-8">

        {/* Filters Sidebar — hidden on mobile, visible on lg+ */}
        <aside className="hidden w-full shrink-0 space-y-3 lg:block lg:w-1/4 xl:w-1/5">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => onResetFiltersClick()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-text-primary shadow-sm hover:bg-muted"
            >
              <RotateCcw size={16} className="shrink-0" aria-hidden />
              Reset filters
            </button>
          )}
          <FiltersSection
            key={searchParams.toString() || "default"}
            radioGroupId="filters-desktop-sidebar"
            categories={apiCategories}
            selectedCategoryId={filterCategoryId}
            onSelectCategory={handleSelectCategory}
            subcategoryOptions={subcategoryOptions}
            selectedSubcategory={filterSubcategory}
            onSelectSubcategory={handleSelectSubcategory}
            locationOptions={locationOptions}
            selectedLocationId={selectedLocationId}
            onSelectLocation={handleSelectLocation}
            searchTerm={searchTerm}
            onSearchTermChange={handleSearchTermChange}
            verifiedOnly={verifiedOnly}
            onVerifiedOnlyChange={handleVerifiedOnlyChange}
            selectedMinRating={selectedMinRating}
            onSelectMinRating={handleSelectMinRating}
            categoriesLoading={categoriesLoading}
          />
        </aside>

        {/* Business Cards Section */}
        <div className="min-w-0 w-full lg:w-3/5 xl:w-3/5">
          <div className="mt-0 lg:mt-4 space-y-4">
            {businessesLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : visibleBusinesses.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No businesses found.</p>
            ) : (
              visibleBusinesses.map((business) => (
                <ServiceCard
                  key={business.id}
                  id={business.id}
                  name={business.name}
                  category={business.category}
                  subcategory={business.subcategory}
                  location={business.location}
                  latitude={business.latitude}
                  longitude={business.longitude}
                  rating={business.rating}
                  reviews={business.reviews}
                  description={business.description}
                  image={business.image}
                  logoUrl={business.logoUrl}
                  coverPhotoUrls={business.coverPhotoUrls}
                  verified={business.verified}
                  favorited={business.isFavorite}
                  phone={business.phone}
                  whatsapp={business.whatsapp}
                  vendorUserUuid={business.vendorUserUuid}
                  socialAccounts={business.socialAccounts}
                />
              ))
            )}
          </div>

          {/* Pagination — only when more than perPage (10) results */}
          {showPagination ? (
          <div className="flex justify-center items-center gap-1.5 sm:gap-2 mt-6 flex-wrap">
            <button
              className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50"
              disabled={safeCurrentPage <= 1}
              onClick={() => {
                const nextPage = Math.max(1, safeCurrentPage - 1);
                const next = new URLSearchParams(searchParams);
                if (nextPage <= 1) next.delete("page");
                else next.set("page", String(nextPage));
                setSearchParams(next, { replace: true });
              }}
            >
              <ChevronLeft size={16} className="text-muted-foreground" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {Array.from({ length: totalPages }).map((_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    onClick={() => {
                      const next = new URLSearchParams(searchParams);
                      if (page <= 1) next.delete("page");
                      else next.set("page", String(page));
                      setSearchParams(next, { replace: true });
                    }}
                    className={`w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm rounded-lg ${page === safeCurrentPage
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-text-primary hover:bg-muted"
                      } ${page > 5 ? "hidden sm:flex items-center justify-center" : "flex items-center justify-center"}`}
                  >
                    {page.toString().padStart(2, "0")}
                  </button>
                );
              })}
            </div>

            <button
              className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => {
                const nextPage = Math.min(totalPages, safeCurrentPage + 1);
                const next = new URLSearchParams(searchParams);
                next.set("page", String(nextPage));
                setSearchParams(next, { replace: true });
              }}
            >
              <ChevronLeft size={16} className="text-muted-foreground rotate-180" />
            </button>
          </div>
          ) : null}
        </div>

        {/* Map Section — hidden on mobile, visible on lg+ */}
        <aside className="hidden lg:block w-2/6 shrink-0">
          <div className="bg-card rounded-lg shadow-md overflow-hidden sticky top-20">
            <div className="h-[750px] bg-muted relative">
              {mapCenter ? (
                <FiltersResultsMap
                  key={`geo-${mapLat}-${mapLng}`}
                  apiKey={env.googleMapsApiKey}
                  center={mapCenter}
                  centerLabel={mapPlaceLabel || undefined}
                  businesses={mapPins}
                  className="h-full w-full"
                />
              ) : (
                <iframe
                  key="map-default"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(mapFallbackQuery)}&t=&z=6&ie=UTF8&iwloc=&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}