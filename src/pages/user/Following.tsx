import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";

import {
  fetchFollowing,
  USER_FOLLOWING_DEFAULT_PER_PAGE,
  type FollowingBusiness,
} from "@/api/follows";
import {
  FollowingBusinessCard,
  followingBusinessImage,
} from "@/components/partials/user/FollowingBusinessCard";
import { UserShell } from "@/components/partials/user/UserShell";
import { Button } from "@/components/ui/button";

function mapFollowingToCardProps(item: FollowingBusiness) {
  const business = item.business;
  return {
    followingUserId: item.following_user_id,
    businessInfoId: business?.id ?? 0,
    title: business?.business_name ?? item.vendor?.name ?? "Business",
    category: business?.category_name ?? "—",
    location: business?.location ?? "—",
    image: followingBusinessImage(business?.logo_url),
    vendorUserUuid: item.vendor?.uuid ?? null,
  };
}

export default function Following() {
  const [page, setPage] = useState(1);

  const followingQuery = useQuery({
    queryKey: ["user-following", page, USER_FOLLOWING_DEFAULT_PER_PAGE],
    queryFn: () =>
      fetchFollowing({ page, per_page: USER_FOLLOWING_DEFAULT_PER_PAGE }),
  });

  const payload = followingQuery.data;
  const following = (payload?.following ?? []).filter((item) => item.business?.id);
  const pagination = payload?.pagination;
  const lastPage = pagination?.last_page ?? 1;

  return (
    <UserShell>
      <section className="min-h-0 flex-1 bg-chat-surface p-3 sm:p-6 lg:min-h-screen lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-ink sm:text-3xl md:text-4xl">Following</h1>
            <p className="mt-2 text-sm font-medium text-body-secondary sm:text-base">
              Businesses you follow for updates and quick access.
            </p>
          </div>
        </div>

        {followingQuery.isLoading ? (
          <p className="mt-6 text-sm font-medium text-body-secondary sm:mt-8">
            Loading businesses you follow…
          </p>
        ) : followingQuery.isError ? (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 sm:mt-8">
            <p className="text-sm font-medium text-ink">Could not load following list.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void followingQuery.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : following.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-border-light bg-card p-8 text-center sm:mt-8">
            <UserPlus className="mx-auto size-10 text-chat-accent/40" aria-hidden />
            <p className="mt-4 text-sm font-medium text-body-secondary">
              You are not following any businesses yet. Browse listings and tap Follow beside a business name.
            </p>
            <Button className="mt-6 rounded-full" asChild>
              <Link to="/filters">Browse businesses</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:mt-8 sm:gap-8 xl:grid-cols-2">
              {following.map((item) => (
                <FollowingBusinessCard
                  key={item.following_user_id}
                  {...mapFollowingToCardProps(item)}
                />
              ))}
            </div>

            {lastPage > 1 ? (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || followingQuery.isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-body-secondary">
                  Page {pagination?.current_page ?? page} of {lastPage}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= lastPage || followingQuery.isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </>
        )}

        <section className="mt-6 flex flex-col gap-5 rounded-2xl border border-success/10 bg-brand p-5 sm:mt-8 sm:rounded-3xl sm:p-8 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-ice sm:text-2xl md:text-3xl">Discover more businesses</h2>
            <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-ice sm:text-base">
              Explore verified providers in your area and follow the ones you want to keep on your radar.
            </p>
          </div>
          <Button className="h-12 w-full shrink-0 rounded-full bg-brand-red px-6 text-sm font-semibold text-ice hover:bg-brand-red/90 sm:h-14 sm:w-auto sm:px-8 sm:text-base" asChild>
            <Link to="/filters" className="inline-flex items-center justify-center gap-2">
              Explore businesses
              <ArrowUpRight className="size-5" aria-hidden />
            </Link>
          </Button>
        </section>
      </section>
    </UserShell>
  );
}
