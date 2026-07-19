import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Wallet } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";

import { fetchAdminUserWallet, type WalletTransaction } from "@/api/wallet";
import { formatNaira } from "@/lib/currency";
import { getLaravelErrorMessage } from "@/lib/laravelApiError";
import { cn } from "@/lib/utils";

const PER_PAGE = 20;

type LocationState = {
  userName?: string;
  userEmail?: string;
};

function formatMoney(amount: number) {
  return formatNaira(amount, { freeLabel: false });
}

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const isCredit = tx.type === "credit";
  return (
    <tr className="border-b border-border-gray last:border-0">
      <td className="px-3 py-3 sm:px-4">
        <p className="text-sm font-medium text-ink">{tx.description}</p>
        <p className="mt-0.5 text-xs text-chat-meta">
          {tx.created_at_human || (tx.created_at ? new Date(tx.created_at).toLocaleString() : "—")}
        </p>
      </td>
      <td className="hidden px-3 py-3 text-sm text-body-secondary sm:table-cell sm:px-4">
        {tx.reference || "—"}
      </td>
      <td className="px-3 py-3 text-right sm:px-4">
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
            isCredit ? "bg-success/10 text-success" : "bg-tint-red text-brand-red",
          )}
        >
          {tx.type}
        </span>
      </td>
      <td
        className={cn(
          "px-3 py-3 text-right text-sm font-semibold sm:px-4",
          isCredit ? "text-success" : "text-brand-red",
        )}
      >
        {isCredit ? "+" : "-"}
        {formatMoney(tx.amount)}
      </td>
      <td className="hidden px-3 py-3 text-right text-sm text-body-secondary md:table-cell md:px-4">
        {formatMoney(tx.balance_after)}
      </td>
    </tr>
  );
}

export default function AdminUserWalletPage() {
  const { userId: userIdParam } = useParams<{ userId: string }>();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;
  const userId = Number(userIdParam);
  const [page, setPage] = useState(1);

  const walletQuery = useQuery({
    queryKey: ["admin", "users", "wallet", userId, page, PER_PAGE],
    queryFn: () => fetchAdminUserWallet(userId, { page, per_page: PER_PAGE }),
    enabled: Number.isFinite(userId) && userId > 0,
  });

  const wallet = walletQuery.data;
  const pagination = wallet?.pagination;
  const lastPage = pagination?.last_page ?? 1;

  const pageNumbers = useMemo(() => {
    const total = lastPage;
    const current = pagination?.current_page ?? page;
    const start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [lastPage, page, pagination?.current_page]);

  if (!Number.isFinite(userId) || userId <= 0) {
    return (
      <div className="rounded-2xl border border-border-gray bg-card p-6">
        <p className="text-sm text-brand-red">Invalid user id.</p>
        <Link
          to="/admin/user-management/user"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-chat-accent hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to users
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to="/admin/user-management/user"
            className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-chat-accent hover:underline"
          >
            <ArrowLeft className="size-4" />
            Back to users
          </Link>
          <p className="text-xs font-semibold uppercase tracking-wider text-chat-accent">User wallet</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink-heading sm:text-3xl">
            {state.userName?.trim() || `User #${userId}`}
          </h1>
          {state.userEmail ? (
            <p className="mt-1 text-sm text-body-secondary">{state.userEmail}</p>
          ) : (
            <p className="mt-1 text-sm text-body-secondary">User ID: {userId}</p>
          )}
        </div>
      </div>

      {walletQuery.isError ? (
        <div className="mb-4 rounded-lg border border-tint-red/40 bg-tint-red/10 px-3 py-2 text-sm text-brand-red">
          {getLaravelErrorMessage(walletQuery.error, "Failed to load wallet.")}
        </div>
      ) : null}

      <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-chat-border-subtle bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Current balance</p>
              <p className="mt-1 text-3xl font-semibold text-ink">
                {walletQuery.isLoading ? "—" : formatMoney(wallet?.balance ?? 0)}
              </p>
            </div>
            <span className="rounded-lg bg-surface-soft p-2 text-chat-accent">
              <Wallet className="size-4" />
            </span>
          </div>
        </article>
        <article className="rounded-xl border border-chat-border-subtle bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Earn balance</p>
          <p className="mt-1 text-3xl font-semibold text-success">
            {walletQuery.isLoading ? "—" : formatMoney(wallet?.earn_balance ?? 0)}
          </p>
          <p className="mt-1 text-xs text-body-secondary">Referral rewards credited</p>
        </article>
        <article className="rounded-xl border border-chat-border-subtle bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Top-up balance</p>
          <p className="mt-1 text-3xl font-semibold text-ink">
            {walletQuery.isLoading ? "—" : formatMoney(wallet?.top_up_balance ?? 0)}
          </p>
          <p className="mt-1 text-xs text-body-secondary">Paid wallet top-ups</p>
        </article>
      </section>

      {(wallet?.summary) ? (
        <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <article className="rounded-xl border border-border-gray bg-card px-4 py-3">
            <p className="text-xs text-chat-meta">Transactions</p>
            <p className="text-lg font-semibold text-ink">{wallet.summary.transaction_count.toLocaleString()}</p>
          </article>
          <article className="rounded-xl border border-border-gray bg-card px-4 py-3">
            <p className="text-xs text-chat-meta">Total credited</p>
            <p className="text-lg font-semibold text-success">{formatMoney(wallet.summary.total_credited)}</p>
          </article>
          <article className="rounded-xl border border-border-gray bg-card px-4 py-3">
            <p className="text-xs text-chat-meta">Total debited</p>
            <p className="text-lg font-semibold text-brand-red">{formatMoney(wallet.summary.total_debited)}</p>
          </article>
        </section>
      ) : null}

      <section className="rounded-2xl border border-border-gray bg-card p-3 shadow-sm sm:p-4 lg:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">Transaction history</h2>
          {walletQuery.isFetching ? (
            <Loader2 className="size-4 animate-spin text-body-secondary" aria-label="Refreshing" />
          ) : null}
        </div>

        <div className="overflow-x-auto rounded-xl border border-border-gray">
          <table className="min-w-full text-left">
            <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-chat-meta">
              <tr>
                <th className="px-3 py-3 sm:px-4">Description</th>
                <th className="hidden px-3 py-3 sm:table-cell sm:px-4">Reference</th>
                <th className="px-3 py-3 text-right sm:px-4">Type</th>
                <th className="px-3 py-3 text-right sm:px-4">Amount</th>
                <th className="hidden px-3 py-3 text-right md:table-cell md:px-4">Balance after</th>
              </tr>
            </thead>
            <tbody>
              {walletQuery.isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-chat-meta">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading transactions…
                    </span>
                  </td>
                </tr>
              ) : (wallet?.transactions ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-chat-meta">
                    No wallet transactions yet.
                  </td>
                </tr>
              ) : (
                wallet?.transactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.total > PER_PAGE ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-body-secondary">
              Page {pagination.current_page} of {lastPage} · {pagination.total.toLocaleString()} total
            </p>
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || walletQuery.isFetching}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-gray text-body-secondary hover:bg-muted disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </button>
              {pageNumbers.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  disabled={walletQuery.isFetching}
                  className={cn(
                    "inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium",
                    page === p ? "bg-ink text-white" : "border border-border-gray text-body-secondary hover:bg-muted",
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={page >= lastPage || walletQuery.isFetching}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-gray text-body-secondary hover:bg-muted disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
