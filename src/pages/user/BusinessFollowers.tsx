import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { Users } from "lucide-react";

import {
  fetchBusinessFollowers,
  USER_FOLLOWERS_DEFAULT_PER_PAGE,
  type FollowerUser,
} from "@/api/follows";
import { fetchUserBusinesses } from "@/api/userBusinesses";
import { FrontendHeader } from "@/components/partials/frontend/FrontendHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/utils/formatters";

function FollowerRow({ follower }: { follower: FollowerUser }) {
  const name = follower.user?.name ?? "User";

  return (
    <div className="flex items-center gap-3 border-b border-border-light px-4 py-3.5 last:border-b-0">
      <Avatar
        src={follower.user?.image_url ?? null}
        name={name}
        className="size-11 rounded-full"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-ink">{name}</p>
        <p className="text-[12.5px] text-chat-meta">
          Followed {formatRelative(follower.followed_at)}
        </p>
      </div>
    </div>
  );
}

export default function BusinessFollowers() {
  const [searchParams] = useSearchParams();
  const businessId = Number(searchParams.get("business_id") ?? "");
  const [page, setPage] = useState(1);

  const businessesQuery = useQuery({
    queryKey: ["user", "businesses", "followers-title"],
    queryFn: fetchUserBusinesses,
    staleTime: 60_000,
  });

  const businessName =
    businessesQuery.data?.find((business) => business.id === businessId)?.businessName ??
    "Business";

  const followersQuery = useQuery({
    queryKey: ["business-followers", businessId, page],
    queryFn: () =>
      fetchBusinessFollowers({
        business_id: businessId,
        page,
        per_page: USER_FOLLOWERS_DEFAULT_PER_PAGE,
      }),
    enabled: Number.isFinite(businessId) && businessId > 0,
  });

  const followers = followersQuery.data?.followers ?? [];
  const pagination = followersQuery.data?.pagination;
  const lastPage = pagination?.last_page ?? 1;

  return (
    <div className="flex min-h-screen flex-col bg-auth-bg text-ink">
      <FrontendHeader />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-5 pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        <div className="mb-4">
          <Link
            to="/user/profile"
            className="text-sm font-semibold text-chat-accent hover:underline"
          >
            Back to profile
          </Link>
          <h1 className="mt-3 font-heading text-2xl font-black tracking-tight">
            {businessName} followers
          </h1>
          <p className="mt-1 text-sm text-chat-meta">
            People who follow your business page.
          </p>
        </div>

        {!Number.isFinite(businessId) || businessId <= 0 ? (
          <div className="rounded-2xl border border-border-light bg-white p-8 text-center text-sm text-chat-meta">
            Choose a business from your profile to view followers.
          </div>
        ) : followersQuery.isLoading ? (
          <p className="text-sm text-chat-meta">Loading followers…</p>
        ) : followersQuery.isError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
            <p className="text-sm text-ink">Could not load followers.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void followersQuery.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : followers.length === 0 ? (
          <div className="rounded-2xl border border-border-light bg-white p-10 text-center">
            <Users className="mx-auto size-10 text-chat-meta/50" aria-hidden />
            <p className="mt-4 text-sm font-medium text-body-secondary">
              No followers yet. Share your business page to grow your audience.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              {followers.map((follower) => (
                <FollowerRow key={follower.follower_user_id} follower={follower} />
              ))}
            </div>

            {lastPage > 1 ? (
              <div className="mt-6 flex items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || followersQuery.isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-chat-meta">
                  Page {pagination?.current_page ?? page} of {lastPage}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= lastPage || followersQuery.isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
