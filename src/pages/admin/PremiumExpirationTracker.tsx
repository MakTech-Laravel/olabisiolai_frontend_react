import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Crown,
  Loader2,
  Search,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { startAdminVendorConversation } from "@/features/business/adminBusinessInfoApi";
import {
  fetchPremiumExpirationTracker,
  type PremiumExpirationItem,
  type PremiumExpirationUrgency,
} from "@/features/payments/adminPremiumApi";
import { showError } from "@/lib/sweetAlert";

const PER_PAGE = 15;

function formatExpiry(item: PremiumExpirationItem): string {
  if (item.expires_at_label) return item.expires_at_label;
  if (!item.expires_at) return "—";
  const date = new Date(item.expires_at);
  if (Number.isNaN(date.getTime())) return item.expires_at;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function daysLabel(days: number | null, urgency: PremiumExpirationItem["urgency"]): string {
  if (days === null || Number.isNaN(days)) return "—";
  if (urgency === "expired" || days < 0) {
    const overdue = Math.abs(days);
    return overdue === 0 ? "Expired today" : `${overdue}d overdue`;
  }
  if (days === 0) return "Expires today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

function UrgencyBadge({ urgency }: { urgency: PremiumExpirationItem["urgency"] }) {
  if (urgency === "expired") {
    return (
      <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
        Expired
      </span>
    );
  }
  if (urgency === "expiring_soon") {
    return (
      <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        Expiring soon
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
      Active
    </span>
  );
}

export default function PremiumExpirationTracker() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [urgency, setUrgency] = useState<PremiumExpirationUrgency>("all");
  const [daysAhead, setDaysAhead] = useState(14);
  const [messagingBusinessId, setMessagingBusinessId] = useState<number | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, urgency, daysAhead]);

  const listQuery = useQuery({
    queryKey: ["admin", "premium-expiration", page, PER_PAGE, debouncedSearch, urgency, daysAhead],
    queryFn: () =>
      fetchPremiumExpirationTracker({
        page,
        per_page: PER_PAGE,
        search: debouncedSearch || undefined,
        urgency,
        days_ahead: daysAhead,
      }),
  });

  const messageMutation = useMutation({
    mutationFn: (businessId: number) => startAdminVendorConversation(businessId),
    onSuccess: ({ conversationUuid }) => {
      navigate(`/admin/messages?c=${encodeURIComponent(conversationUuid)}`);
    },
    onError: (error: unknown) => {
      showError(error instanceof Error ? error.message : "Could not open vendor chat.");
    },
    onSettled: () => setMessagingBusinessId(null),
  });

  const summary = listQuery.data?.summary;
  const items = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination ?? {
    current_page: 1,
    last_page: 1,
    per_page: PER_PAGE,
    total: 0,
  };
  const lastPage = Math.max(1, pagination.last_page);

  const pageNumbers = useMemo(() => {
    const cur = pagination.current_page;
    const last = lastPage;
    const max = 7;
    if (last <= max) return Array.from({ length: last }, (_, i) => i + 1);
    let start = Math.max(1, cur - Math.floor(max / 2));
    let end = start + max - 1;
    if (end > last) {
      end = last;
      start = Math.max(1, end - max + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [pagination.current_page, lastPage]);

  const rangeFrom = pagination.total === 0 ? 0 : (pagination.current_page - 1) * pagination.per_page + 1;
  const rangeTo = Math.min(pagination.current_page * pagination.per_page, pagination.total);

  const errorMessage =
    listQuery.error instanceof Error && listQuery.error.message.trim()
      ? listQuery.error.message
      : "Failed to load premium expiration tracker.";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold leading-tight text-ink-heading sm:text-3xl">
            Premium Expiration Tracker
          </h1>
          <p className="mt-1 text-sm text-chat-meta">
            Track premium vendor expiry dates and follow up for reactivation.
          </p>
        </div>
        <Link
          to="/admin/businesses"
          className="inline-flex h-10 items-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Open businesses
        </Link>
      </div>

      <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-chat-border-subtle bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Premium tracked</p>
          <p className="mt-1 text-4xl font-semibold leading-10 text-ink">
            {(summary?.total_premium ?? 0).toLocaleString()}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-red">
            <Crown className="size-3.5" aria-hidden />
            Active + expired plans
          </p>
        </article>
        <article
          className={`rounded-xl border border-chat-border-subtle bg-card p-4 ${urgency === "active" ? "ring-2 ring-green-200" : ""}`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Healthy</p>
          <p className="mt-1 text-4xl font-semibold leading-10 text-ink">
            {(summary?.active ?? 0).toLocaleString()}
          </p>
          <button
            type="button"
            onClick={() => setUrgency((current) => (current === "active" ? "all" : "active"))}
            className="mt-1 text-xs font-medium text-green-700 hover:underline"
          >
            {urgency === "active" ? "Clear filter" : "Show healthy only"}
          </button>
        </article>
        <article
          className={`rounded-xl border border-chat-border-subtle bg-card p-4 ${urgency === "expiring_soon" ? "ring-2 ring-amber-200" : ""}`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">
            Expiring in {daysAhead} days
          </p>
          <p className="mt-1 text-4xl font-semibold leading-10 text-ink">
            {(summary?.expiring_soon ?? 0).toLocaleString()}
          </p>
          <button
            type="button"
            onClick={() =>
              setUrgency((current) => (current === "expiring_soon" ? "all" : "expiring_soon"))
            }
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:underline"
          >
            <Clock3 className="size-3.5" aria-hidden />
            {urgency === "expiring_soon" ? "Clear filter" : "Needs outreach"}
          </button>
        </article>
        <article
          className={`rounded-xl border border-chat-border-subtle bg-card p-4 ${urgency === "expired" ? "ring-2 ring-red-200" : ""}`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Expired</p>
          <p className="mt-1 text-4xl font-semibold leading-10 text-ink">
            {(summary?.expired ?? 0).toLocaleString()}
          </p>
          <button
            type="button"
            onClick={() => setUrgency((current) => (current === "expired" ? "all" : "expired"))}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-red hover:underline"
          >
            <TriangleAlert className="size-3.5" aria-hidden />
            {urgency === "expired" ? "Clear filter" : "Reactivation queue"}
          </button>
        </article>
      </section>

      {listQuery.isError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mx-auto max-w-9xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search business, vendor, email, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-700 outline-none transition-all placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              Window
              <select
                value={daysAhead}
                onChange={(e) => setDaysAhead(Number(e.target.value))}
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
              </select>
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as PremiumExpirationUrgency)}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none"
            >
              <option value="all">All statuses</option>
              <option value="active">Healthy</option>
              <option value="expiring_soon">Expiring soon</option>
              <option value="expired">Expired</option>
            </select>
            {listQuery.isFetching && !listQuery.isLoading ? (
              <Loader2 className="size-4 animate-spin text-gray-400" aria-hidden />
            ) : null}
            <button
              type="button"
              onClick={() => void queryClient.invalidateQueries({ queryKey: ["admin", "premium-expiration"] })}
              className="inline-flex h-10 items-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Business", "Vendor", "Category", "Status", "Expires", "Countdown", "Actions"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-900 ${heading === "Actions" ? "text-right" : ""}`}
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {listQuery.isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                    Loading premium expirations…
                  </td>
                </tr>
              ) : null}
              {items.map((item) => (
                <tr key={item.subscription_id} className="transition-colors hover:bg-gray-50/60">
                  <td className="px-6 py-3.5 font-medium text-gray-900">{item.business_name}</td>
                  <td className="px-6 py-3.5 text-gray-900">
                    <div className="max-w-[200px] truncate" title={item.vendor_name}>
                      {item.vendor_name}
                    </div>
                    {item.vendor_email ? (
                      <div className="max-w-[200px] truncate text-xs text-gray-500" title={item.vendor_email}>
                        {item.vendor_email}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-6 py-3.5 text-gray-700">{item.category}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex flex-col items-start gap-1">
                      <UrgencyBadge urgency={item.urgency} />
                      {item.is_trial ? (
                        <span className="text-[11px] font-medium text-blue-600">Trial</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-gray-900">{formatExpiry(item)}</td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <span
                      className={
                        item.urgency === "expired"
                          ? "font-medium text-red-600"
                          : item.urgency === "expiring_soon"
                            ? "font-medium text-amber-700"
                            : "text-gray-700"
                      }
                    >
                      {daysLabel(item.days_remaining, item.urgency)}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to="/admin/businesses"
                        className="inline-flex h-8 items-center rounded-md border border-gray-200 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Businesses
                      </Link>
                      <button
                        type="button"
                        className="inline-flex h-8 items-center gap-1 rounded-md bg-brand-red px-3 text-xs font-semibold text-white hover:bg-brand-red/90 disabled:opacity-60"
                        disabled={messagingBusinessId === item.business_id}
                        onClick={() => {
                          setMessagingBusinessId(item.business_id);
                          messageMutation.mutate(item.business_id);
                        }}
                      >
                        {messagingBusinessId === item.business_id ? (
                          <Loader2 className="size-3 animate-spin" aria-hidden />
                        ) : (
                          <ArrowUpRight className="size-3" aria-hidden />
                        )}
                        Follow up
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!listQuery.isLoading && items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                    No premium subscriptions match this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <p className="text-xs text-gray-400">
            Showing {rangeFrom}-{rangeTo} of {pagination.total} (page {pagination.current_page} of{" "}
            {lastPage})
          </p>
          <div className="flex flex-wrap items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.current_page <= 1 || listQuery.isFetching}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            {pageNumbers.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                disabled={listQuery.isFetching}
                className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium ${pagination.current_page === p
                    ? "bg-gray-900 text-white"
                    : "border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={pagination.current_page >= lastPage || listQuery.isFetching}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
