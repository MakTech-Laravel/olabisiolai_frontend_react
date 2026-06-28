import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FeaturedCard } from "@/components/FeaturedCard";
import { fetchPublicBusinesses } from "@/features/business/publicBusinessApi";

function SkeletonCard() {
  return (
    <div className="bg-card rounded-lg shadow-md overflow-hidden animate-pulse flex h-full min-h-[32rem] flex-col">
      <div className="w-full h-48 bg-muted" />
      <div className="p-6 space-y-3 flex flex-col flex-1">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/3" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-3 bg-muted rounded w-1/4" />
        <div className="h-12 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
        <div className="h-10 bg-muted rounded" />
      </div>
    </div>
  );
}

export default function Featured() {
  const {
    data: businesses,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["businesses", "home"],
    queryFn: () => fetchPublicBusinesses(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const list = businesses ?? [];

  return (
    <div className="lg:mb-20 mb-12 bg-bg-section">
      <div className="container mx-auto px-4 lg:py-24 py-12">
        <h2 className="lg:text-3xl text-2xl font-inter font-bold text-text-primary">
          Featured & Verified Businesses
        </h2>

        <div className="mt-12">
          {isLoading ? (
            <div className="grid grid-cols-1 items-stretch gap-12 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : isError ? (
            <p className="text-center text-destructive font-inter py-12">
              {import.meta.env.DEV
                ? `Failed to load businesses: ${(error as Error)?.message ?? "Unknown error"}`
                : "Unable to load businesses. Please try again later."}
            </p>
          ) : list.length === 0 ? (
            <p className="text-center text-text-secondary font-inter py-12">
              No businesses available at the moment.
            </p>
          ) : (
            <div className="grid grid-cols-1 items-stretch gap-12 md:grid-cols-2 lg:grid-cols-3">
              {list.slice(0, 6).map((business) => (
                <FeaturedCard
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
                  isPremium={business.isPremium}
                  boostStatus={business.boostStatus}
                  isFollowing={business.isFollowing}
                  followersCount={business.followersCount}
                  phone={business.phone}
                  whatsapp={business.whatsapp}
                  vendorUserId={business.vendorUserId}
                  vendorUserUuid={business.vendorUserUuid}
                  socialAccounts={business.socialAccounts}
                />
              ))}
            </div>
          )}
        </div>

        <div className="relative z-20 mt-8 text-center">
          <Link
            to="/filters"
            className="relative z-20 inline-flex rounded-xl bg-primary px-4 py-3 font-inter text-lg font-normal text-primary-foreground"
          >
            View All Businesses
          </Link>
        </div>
      </div>
    </div>
  );
}
