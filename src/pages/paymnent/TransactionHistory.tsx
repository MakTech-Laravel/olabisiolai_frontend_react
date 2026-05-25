import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  downloadVendorPaymentsCsv,
  fetchVendorPayments,
  type SubscriptionMonthRange,
  type VendorPaymentListItem,
} from "@/features/vendor/vendorPaymentsApi";
import { getLaravelErrorMessage } from "@/lib/laravelApiError";
import { showError, showSuccess } from "@/lib/sweetAlert";
import { formatMoney } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { Download, Eye, Loader2 } from "lucide-react";

function formatWhen(row: VendorPaymentListItem) {
  const raw = row.paid_at_iso ?? row.created_at;
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return row.paid_at ?? "—";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function statusClass(status: string) {
  const s = status.toLowerCase();
  if (s === "completed") return "bg-emerald-50 text-emerald-800";
  if (s === "failed") return "bg-rose-50 text-rose-800";
  return "bg-amber-50 text-amber-900";
}

function purposeBadgeClass(purpose: string) {
  const p = purpose.toLowerCase();
  if (p === "subscription") return "bg-violet-100 text-violet-900";
  if (p === "verification") return "bg-sky-100 text-sky-900";
  if (p === "boosting" || p === "boost") return "bg-amber-100 text-amber-900";
  return "bg-slate-100 text-slate-800";
}

/** Months from first successful subscription payment month through current month (newest first). */
function monthsFromSubscriptionRange(range: SubscriptionMonthRange | undefined): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [{ value: "", label: "All months" }];
  if (!range?.start_month || !range?.end_month) return out;

  const [sy, sm] = range.start_month.split("-").map(Number);
  const [ey, em] = range.end_month.split("-").map(Number);
  if ([sy, sm, ey, em].some((n) => Number.isNaN(n))) {
    return out;
  }

  let y = ey;
  let m = em;
  for (let i = 0; i < 600; i += 1) {
    const value = `${y}-${String(m).padStart(2, "0")}`;
    const d = new Date(y, m - 1, 1);
    const label = d.toLocaleString(undefined, { month: "long", year: "numeric" });
    out.push({ value, label });
    if (y === sy && m === sm) break;
    m -= 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
  }

  return out;
}

export function TransactionHistory() {
  const [purpose, setPurpose] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const queryKey = useMemo(
    () => ["vendor", "payments", { purpose, month, page }] as const,
    [purpose, month, page],
  );

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      fetchVendorPayments({
        page,
        per_page: 10,
        purpose: purpose || undefined,
        month: month || undefined,
      }),
  });

  const monthChoices = useMemo(
    () => monthsFromSubscriptionRange(data?.subscription_month_range),
    [data?.subscription_month_range],
  );

  useEffect(() => {
    const range = data?.subscription_month_range;
    if (!range || month === "") return;
    const allowed = new Set(monthChoices.map((o) => o.value));
    if (!allowed.has(month)) {
      setMonth("");
      setPage(1);
    }
  }, [data?.subscription_month_range, month, monthChoices]);

  const rows = data?.items ?? [];
  const pagination = data?.pagination;
  const subRange = data?.subscription_month_range;

  const onDownloadCsv = async () => {
    try {
      setIsExporting(true);
      await downloadVendorPaymentsCsv({
        purpose: purpose || undefined,
        month: month || undefined,
      });
      showSuccess("Payment history downloaded.");
    } catch (err) {
      showError(getLaravelErrorMessage(err, "Could not download payment history."));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <div className="border-b px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-inter text-xl font-bold">Payment history</p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="whitespace-nowrap">Type</span>
                <select
                  className="min-w-[140px] rounded-md border bg-[#EFF4FF] px-2 py-1 text-sm"
                  value={purpose}
                  onChange={(e) => {
                    setPurpose(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All types</option>
                  <option value="subscription">Subscription</option>
                  <option value="verification">Verification</option>
                  <option value="boosting">Boosting</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="whitespace-nowrap">Month</span>
                <select
                  className="min-w-[160px] rounded-md border bg-[#EFF4FF] px-2 py-1 text-sm"
                  value={month}
                  onChange={(e) => {
                    setMonth(e.target.value);
                    setPage(1);
                  }}
                >
                  {monthChoices.map((opt) => (
                    <option key={opt.value || "all"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <Button type="button" variant="outline" size="sm" className="bg-[#EFF4FF]" onClick={() => void refetch()}>
                Refresh
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1 bg-[#EFF4FF]"
                disabled={isPending || isExporting}
                title="CSV includes all payments matching the selected type and month (up to 10,000 rows)."
                onClick={() => void onDownloadCsv()}
              >
                {isExporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                Download CSV
              </Button>
            </div>
          </div>
          {subRange ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {subRange.has_subscription_history
                ? `Month list runs from your first successful subscription (${subRange.start_month}) through ${subRange.end_month}.`
                : "Month list shows the current month until you complete a subscription payment; then it expands from that month through today."}
            </p>
          ) : null}
        </div>

        {isPending ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
            Loading payments…
          </div>
        ) : null}

        {isError ? (
          <p className="px-4 py-6 text-sm text-destructive">
            {(error as Error)?.message ?? "Could not load payments."}
          </p>
        ) : null}

        {!isPending && !isError ? (
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-[#EFF4FF] text-xs font-inter font-bold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground" colSpan={7}>
                    No payments match these filters. Try another type or month.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-4 py-3 font-inter text-sm">{formatWhen(row)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          purposeBadgeClass(row.purpose),
                        )}
                      >
                        {row.purpose_label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.tx_ref}</td>
                    <td className="px-4 py-3">
                      <p className="font-inter text-sm font-semibold">{row.description}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatMoney(row.amount, row.currency)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                          statusClass(row.status),
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" asChild className="gap-1 text-sky-800">
                        <Link to={`/vendor/payments/${row.id}`}>
                          <Eye className="size-4" />
                          Details
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : null}

        {pagination && pagination.last_page > 1 ? (
          <div className="flex flex-col items-center justify-between gap-2 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row">
            <p>
              Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total)
            </p>
            <div className="inline-flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.current_page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
