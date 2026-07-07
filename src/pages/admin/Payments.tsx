import { ChevronDown, ChevronLeft, ChevronRight, Download, Eye, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { PaymentDetailsModal } from "@/components/Modal/PaymentDetailsModal";
import type { PaymentRow, PaymentStatus, PaymentStatusFilter } from "@/components/Modal/PaymentDetailsModal.types";
import {
  exportAdminPaymentsCsv,
  fetchAdminPayments,
  fetchAdminPaymentsAnalytics,
  type AdminPaymentListItem,
  type AdminPaymentTransactionType,
} from "@/features/payments/adminPaymentsApi";
import { formatNaira } from "@/lib/currency";
import { showError } from "@/lib/sweetAlert";

type TransactionTab = "all" | AdminPaymentTransactionType;

const PER_PAGE = 10;

function formatNgn(amount: number) {
  return formatNaira(amount, { freeLabel: false });
}

function formatCompactNgn(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) return "₦0";
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    const text = millions >= 10 ? millions.toFixed(0) : millions.toFixed(1);
    return `₦${text.replace(/\.0$/, "")}M`;
  }
  if (amount >= 1_000) {
    const thousands = amount / 1_000;
    const text = thousands >= 10 ? thousands.toFixed(0) : thousands.toFixed(1);
    return `₦${text.replace(/\.0$/, "")}K`;
  }
  return formatNgn(amount);
}

function methodLabel(method: PaymentRow["method"]) {
  if (method === "card") return "Card";
  if (method === "bank_transfer") return "Bank transfer";
  return "Wallet";
}

function transactionTypeLabel(type: AdminPaymentTransactionType): string {
  if (type === "wallet_top_up") return "Wallet top-up";
  if (type === "subscription") return "Subscription";
  if (type === "boost") return "Boost";
  if (type === "verification") return "Verification";
  return type;
}

function GrowthLabel({ value }: { value: number | null }) {
  if (value === null) {
    return <p className="text-xs font-medium text-chat-meta">—</p>;
  }
  const positive = value >= 0;
  return (
    <p className={`text-xs font-medium ${positive ? "text-success" : "text-red-600"}`}>
      {positive ? "+" : ""}
      {value}%
    </p>
  );
}

function StatusCell({ status }: { status: PaymentStatus }) {
  if (status === "completed") {
    return (
      <span className="inline-flex rounded-full bg-[rgb(27_175_93/0.1)] px-2.5 py-0.5 text-xs font-medium text-[#1baf5d]">
        Completed
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
      Failed
    </span>
  );
}

export default function Payments() {
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TransactionTab>("all");
  const [trendRange, setTrendRange] = useState<"monthly" | "yearly">("monthly");
  const [page, setPage] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<AdminPaymentListItem | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, activeTab]);

  const listQuery = useQuery({
    queryKey: ["admin", "payments", page, statusFilter, activeTab],
    queryFn: () =>
      fetchAdminPayments({
        page,
        per_page: PER_PAGE,
        status: statusFilter,
        purpose: activeTab,
      }),
  });

  const analyticsQuery = useQuery({
    queryKey: ["admin", "payments", "analytics", trendRange],
    queryFn: () => fetchAdminPaymentsAnalytics(trendRange),
  });

  const payments = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination ?? {
    current_page: 1,
    last_page: 1,
    per_page: PER_PAGE,
    total: 0,
  };

  const overview = analyticsQuery.data?.overview;
  const trendSeries = analyticsQuery.data?.trend ?? [];
  const breakdown = analyticsQuery.data?.breakdown ?? [];

  const filterLabel =
    statusFilter === "all"
      ? "Select status"
      : statusFilter === "completed"
        ? "Completed"
        : statusFilter === "pending"
          ? "Pending"
          : "Failed";

  const chartHeight = 128;
  const chartWidth = 560;
  const spacing = chartWidth / Math.max(trendSeries.length - 1, 1);
  const trendValues = trendSeries.map((point) => point.value);
  const maxValue = trendValues.length > 0 ? Math.max(...trendValues) : 1;
  const minValue = trendValues.length > 0 ? Math.min(...trendValues) : 0;
  const range = Math.max(maxValue - minValue, 1);

  const points = trendSeries
    .map((point, index) => {
      const x = index * spacing;
      const y = chartHeight - ((point.value - minValue) / range) * (chartHeight - 20) - 10;
      return `${x},${y}`;
    })
    .join(" ");

  const lastPage = Math.max(1, pagination.last_page);
  const rangeFrom = pagination.total === 0 ? 0 : (pagination.current_page - 1) * pagination.per_page + 1;
  const rangeTo = Math.min(pagination.current_page * pagination.per_page, pagination.total);

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

  const exportForFinance = async () => {
    setExporting(true);
    try {
      const blob = await exportAdminPaymentsCsv({
        status: statusFilter,
        purpose: activeTab,
      });
      const now = new Date();
      const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `finance-payments-${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const analyticsLoading = analyticsQuery.isLoading && !analyticsQuery.data;
  const listLoading = listQuery.isLoading && !listQuery.data;

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold leading-8 text-ink-heading sm:text-2xl">Payments</h1>
        <p className="mt-1 text-sm text-chat-meta">Track platform revenue and verification settlements.</p>
      </div>

      <section className="mb-4 rounded-2xl border border-chat-border-subtle bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-chat-accent">Financial Overview</p>
            <h2 className="text-xl font-semibold text-ink">Payments & Revenue</h2>
          </div>
          <button
            type="button"
            onClick={() => void exportForFinance()}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-lg border border-border-gray bg-background px-3 py-2 text-xs font-semibold text-ink hover:bg-muted disabled:opacity-60"
          >
            {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Export for Finance
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-chat-border-subtle bg-background p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-chat-meta">Total Revenue</p>
            <p className="mt-1 text-4xl font-semibold leading-10 text-ink">
              {analyticsLoading ? "…" : formatCompactNgn(overview?.total_revenue ?? 0)}
            </p>
            <GrowthLabel value={overview?.total_growth_percent ?? null} />
          </article>
          <article className="rounded-xl border border-chat-border-subtle bg-background p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-chat-meta">Verification Revenue</p>
            <p className="mt-1 text-4xl font-semibold leading-10 text-ink">
              {analyticsLoading ? "…" : formatCompactNgn(overview?.verification_revenue ?? 0)}
            </p>
            <GrowthLabel value={overview?.verification_growth_percent ?? null} />
          </article>
          <article className="rounded-xl border border-chat-border-subtle bg-background p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-chat-meta">Subscription Revenue</p>
            <p className="mt-1 text-4xl font-semibold leading-10 text-ink">
              {analyticsLoading ? "…" : formatCompactNgn(overview?.subscription_revenue ?? 0)}
            </p>
            <GrowthLabel value={overview?.subscription_growth_percent ?? null} />
          </article>
          <article className="rounded-xl border border-chat-border-subtle bg-background p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-chat-meta">Boost Revenue</p>
            <p className="mt-1 text-4xl font-semibold leading-10 text-ink">
              {analyticsLoading ? "…" : formatCompactNgn(overview?.boost_revenue ?? 0)}
            </p>
            <GrowthLabel value={overview?.boost_growth_percent ?? null} />
          </article>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
          <article className="rounded-xl border border-chat-border-subtle bg-background p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink">Revenue Trends</p>
              <div className="inline-flex rounded-md border border-border-gray bg-card p-1">
                <button
                  type="button"
                  onClick={() => setTrendRange("monthly")}
                  className={`rounded px-2.5 py-1 text-xs font-medium ${trendRange === "monthly" ? "bg-chat-accent text-ice" : "text-body-secondary hover:bg-muted"
                    }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setTrendRange("yearly")}
                  className={`rounded px-2.5 py-1 text-xs font-medium ${trendRange === "yearly" ? "bg-chat-accent text-ice" : "text-body-secondary hover:bg-muted"
                    }`}
                >
                  Yearly
                </button>
              </div>
            </div>
            <div className="mt-3 rounded-md border border-border-gray bg-linear-to-b from-blue-50 to-transparent p-3">
              {analyticsLoading ? (
                <div className="flex h-28 items-center justify-center">
                  <Loader2 className="size-6 animate-spin text-chat-accent" />
                </div>
              ) : (
                <>
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-28 w-full" preserveAspectRatio="none">
                    {[0, 1, 2, 3].map((line) => {
                      const y = (chartHeight / 4) * line;
                      return (
                        <line
                          key={line}
                          x1={0}
                          y1={y}
                          x2={chartWidth}
                          y2={y}
                          stroke="currentColor"
                          className="text-border-gray"
                          strokeWidth="1"
                        />
                      );
                    })}
                    {trendSeries.length > 0 ? (
                      <>
                        <polyline
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          className="text-chat-accent"
                          points={points}
                        />
                        {trendSeries.map((point, index) => {
                          const x = index * spacing;
                          const y = chartHeight - ((point.value - minValue) / range) * (chartHeight - 20) - 10;
                          return <circle key={point.label} cx={x} cy={y} r="3" className="fill-chat-accent" />;
                        })}
                      </>
                    ) : null}
                  </svg>
                  <div
                    className="mt-2 grid text-[10px] text-body-secondary"
                    style={{ gridTemplateColumns: `repeat(${Math.max(trendSeries.length, 1)}, minmax(0, 1fr))` }}
                  >
                    {trendSeries.map((point) => (
                      <span key={point.label} className="text-center">
                        {point.label}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </article>
          <article className="rounded-xl border border-chat-border-subtle bg-background p-3">
            <p className="text-sm font-semibold text-ink">Revenue Breakdown</p>
            <div className="mt-2 space-y-2 text-xs">
              {breakdown.length === 0 && !analyticsLoading ? (
                <p className="text-body-secondary">No completed payments yet.</p>
              ) : null}
              {breakdown.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-body-secondary">
                    <span>{item.label}</span>
                    <span>{item.width_percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-chat-accent"
                      style={{ width: `${item.width_percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-border-gray bg-card p-6 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)]">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-ink">Transaction History</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-b border-border-gray pb-2">
            {([
              ["all", "All Transactions"],
              ["subscription", "Subscriptions"],
              ["boost", "Boosts"],
              ["verification", "Verification"],
              ["wallet_top_up", "Wallet top-ups"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold ${activeTab === key ? "bg-chat-accent text-ice" : "text-body-secondary hover:bg-muted"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="relative inline-block w-48">
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              className="flex h-[42px] w-full items-center justify-between rounded-xl border border-border-gray bg-card pl-[15px] pr-10 text-left text-sm font-normal text-ink"
            >
              {filterLabel}
            </button>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-5 -translate-y-1/2 text-body-secondary" />
            {filterOpen ? (
              <div className="absolute left-0 z-20 mt-2 w-full overflow-hidden rounded-xl border border-border-gray bg-card shadow-sm">
                {(["all", "completed", "pending", "failed"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setStatusFilter(key);
                      setFilterOpen(false);
                    }}
                    className="flex w-full px-3 py-2 text-left text-sm text-ink hover:bg-muted"
                  >
                    {key === "all" ? "All statuses" : key === "completed" ? "Completed" : key === "pending" ? "Pending" : "Failed"}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse">
            <thead>
              <tr className="border-b border-border-gray">
                <th className="px-4 py-3 text-left text-sm font-semibold text-body-secondary">Business</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-body-secondary">Payer</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-body-secondary">Reference</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-body-secondary">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-body-secondary">Method</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-body-secondary">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-body-secondary">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-body-secondary">Date</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-body-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-chat-meta">
                    <Loader2 className="mx-auto size-6 animate-spin text-chat-accent" />
                  </td>
                </tr>
              ) : null}
              {!listLoading && payments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-chat-meta">
                    No payments for this filter.
                  </td>
                </tr>
              ) : null}
              {!listLoading
                ? payments.map((row) => (
                  <tr key={row.listKey ?? row.id} className="border-b border-border-light">
                    <td className="px-4 py-5 text-base font-medium text-ink">{row.business}</td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-ink">{row.payerName}</p>
                      <p className="text-xs text-gray-500">{row.payerEmail}</p>
                    </td>
                    <td className="px-4 py-4 font-mono text-sm text-ink">{row.reference}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-ink">{formatNgn(row.amountNgn)}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{methodLabel(row.method)}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{transactionTypeLabel(row.transactionType)}</td>
                    <td className="px-4 py-4">
                      <StatusCell status={row.status} />
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{row.dateShort}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedPayment(row)}
                          className="inline-flex h-8 items-center gap-2 rounded-xl px-3 text-sm font-medium text-body-secondary hover:bg-muted"
                        >
                          <Eye className="size-4 shrink-0" strokeWidth={2} />
                          View details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
                : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-tint-red/20 px-1 pb-0 pt-4">
          <p className="text-xs font-medium text-stone-700">
            Showing {rangeFrom}-{rangeTo} of {pagination.total} payments
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-lg text-stone-700 hover:bg-muted disabled:opacity-30"
              disabled={pagination.current_page <= 1 || listQuery.isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                disabled={listQuery.isFetching}
                className={`flex size-8 items-center justify-center rounded-lg text-xs font-semibold ${pagination.current_page === pageNumber
                  ? "bg-brand-red text-white"
                  : "text-stone-700 hover:bg-muted"
                  }`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-lg text-stone-700 hover:bg-muted disabled:opacity-30"
              disabled={pagination.current_page >= lastPage || listQuery.isFetching}
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              aria-label="Next page"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </section>

      <PaymentDetailsModal
        open={selectedPayment !== null}
        onClose={() => setSelectedPayment(null)}
        payment={selectedPayment}
      />
    </div>
  );
}
