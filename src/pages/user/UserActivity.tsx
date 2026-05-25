import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Bell, CheckCheck, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { fetchNotifications } from "@/api/notifications";
import { UserShell } from "@/components/partials/user/UserShell";
import { Button } from "@/components/ui/button";
import { QUERY_KEYS } from "@/constants/queryKeys";
import {
  formatNotificationTime,
  toneDotClass,
  toUserNotificationDisplay,
} from "@/features/notifications/notificationDisplay";
import { useNotificationMutations } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

const PER_PAGE = 20;

function buildPageNumbers(current: number, last: number): (number | "gap")[] {
  if (last <= 1) return [1];
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }
  const out: (number | "gap")[] = [];
  const push = (n: number | "gap") => {
    if (out.length && out[out.length - 1] === n) return;
    out.push(n);
  };
  const windowStart = Math.max(2, current - 1);
  const windowEnd = Math.min(last - 1, current + 1);
  push(1);
  if (windowStart > 2) push("gap");
  for (let p = windowStart; p <= windowEnd; p++) push(p);
  if (windowEnd < last - 1) push("gap");
  push(last);
  return out;
}

export default function UserActivity() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError, refetch, isPlaceholderData } = useQuery({
    queryKey: QUERY_KEYS.notifications({ page, perPage: PER_PAGE, unreadOnly: false }),
    queryFn: () => fetchNotifications({ page, perPage: PER_PAGE, unreadOnly: false }),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });

  const { markAllRead } = useNotificationMutations();
  const unreadCount = data?.unread_count ?? 0;
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = meta?.last_page ?? 1;
  const rows = useMemo(
    () => (data?.items ?? []).map(toUserNotificationDisplay),
    [data?.items],
  );

  const pageNumbers = useMemo(() => buildPageNumbers(page, totalPages), [page, totalPages]);

  const rangeFrom = total === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const rangeTo = Math.min(page * PER_PAGE, total);

  const showInitialSpinner = isLoading && !data;

  return (
    <UserShell active="settings">
      <section className="min-h-0 flex-1 rounded-xl bg-card p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link
              to="/user/dashboard"
              className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-chat-accent hover:underline"
            >
              <ChevronLeft className="size-4" aria-hidden />
              Back to overview
            </Link>
            <div className="flex items-center gap-2">
              <Bell className="size-6 text-chat-accent" aria-hidden />
              <h1 className="text-xl font-semibold text-ink sm:text-2xl">All activity</h1>
            </div>
            <p className="mt-1 text-sm text-chat-meta">
              Messages, account updates, and alerts in one place.
            </p>
          </div>
          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              {markAllRead.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <CheckCheck className="size-4" aria-hidden />
              )}
              Mark all as read
            </Button>
          ) : null}
        </div>

        {total > 0 ? (
          <p className="mt-4 text-xs text-chat-meta">
            Showing <span className="font-semibold text-ink">{rangeFrom}</span>–
            <span className="font-semibold text-ink">{rangeTo}</span> of{" "}
            <span className="font-semibold text-ink">{total}</span>
            {isFetching && !showInitialSpinner ? (
              <span className="ml-2 inline-flex items-center gap-1 text-chat-accent">
                <Loader2 className="size-3 animate-spin" aria-hidden />
                Updating…
              </span>
            ) : null}
          </p>
        ) : null}

        <div
          className={cn(
            "mt-4 space-y-0 rounded-xl border border-chat-border-subtle bg-chat-input-bg/40 transition-opacity",
            isPlaceholderData && isFetching && "opacity-70",
          )}
        >
          {isError ? (
            <div className="p-6 text-center text-sm text-destructive">
              Could not load activity.{" "}
              <button type="button" className="font-medium underline" onClick={() => void refetch()}>
                Retry
              </button>
            </div>
          ) : showInitialSpinner ? (
            <div className="flex items-center justify-center gap-2 py-16 text-chat-meta">
              <Loader2 className="size-5 animate-spin" aria-hidden />
              Loading activity…
            </div>
          ) : rows.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Bell className="mx-auto size-10 text-chat-meta/50" aria-hidden />
              <p className="mt-3 text-sm font-medium text-ink">No activity on this page</p>
              <p className="mt-1 text-xs text-chat-meta">
                When you get messages or account updates, they will show up here.
              </p>
              {page > 1 ? (
                <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => setPage(1)}>
                  Back to page 1
                </Button>
              ) : null}
            </div>
          ) : (
            rows.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  navigate(item.href);
                }}
                className={cn(
                  "flex w-full gap-3 border-chat-border-subtle px-4 py-4 text-left transition hover:bg-card/80 sm:px-6",
                  index > 0 && "border-t",
                  !item.isRead && "bg-card/60",
                )}
              >
                <span
                  className={cn("mt-1.5 size-2 shrink-0 rounded-full", toneDotClass(item.tone))}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  {item.message ? (
                    <p className="mt-0.5 text-xs text-chat-meta line-clamp-2">{item.message}</p>
                  ) : null}
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-chat-meta/70">
                    {formatNotificationTime(item.createdAt).toUpperCase()}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>

        {totalPages > 1 ? (
          <div className="mt-6 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage(1)}
              >
                First
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" aria-hidden />
                Previous
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1">
              {pageNumbers.map((entry, idx) =>
                entry === "gap" ? (
                  <span key={`gap-${idx}`} className="px-1 text-xs text-chat-meta">
                    …
                  </span>
                ) : (
                  <Button
                    key={entry}
                    type="button"
                    variant={entry === page ? "default" : "outline"}
                    size="sm"
                    className={cn("min-w-9", entry === page && "pointer-events-none")}
                    disabled={isFetching}
                    onClick={() => setPage(entry)}
                  >
                    {entry}
                  </Button>
                ),
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={page >= totalPages || isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="size-4" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isFetching}
                onClick={() => setPage(totalPages)}
              >
                Last
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </UserShell>
  );
}
