import { Eye, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { VendorBoostCampaignDetailsDialog } from "@/components/sections/vendor/boost/VendorBoostCampaignDetailsDialog";
import {
  displayStatusClasses,
  formatCompactCount,
  tierBadgeClasses,
  type BoostCampaignRow,
} from "@/features/boost/boostCampaignTypes";
import {
  groupVendorCampaignRows,
  type BoostCampaignGroupRow,
} from "@/features/boost/groupVendorCampaignRows";
import { formatNaira } from "@/lib/currency";
import { cn } from "@/lib/utils";

type Props = {
  rows: BoostCampaignRow[];
  loading?: boolean;
  title?: string;
  subtitle?: string;
  showVendorColumn?: boolean;
  showDetailsAction?: boolean;
  showPerformanceMetrics?: boolean;
  vendorActions?: boolean;
  onExtendBoost?: (row: BoostCampaignRow) => void;
  onBoostAgain?: (row: BoostCampaignRow) => void;
  onContinuePayment?: (row: BoostCampaignRow) => void;
  groupExtensions?: boolean;
  emptyMessage?: string;
};

export function VendorBoostCampaignsTable({
  rows,
  loading = false,
  title = "Your boost campaigns",
  subtitle,
  showVendorColumn = false,
  showDetailsAction = false,
  showPerformanceMetrics = false,
  vendorActions = false,
  onExtendBoost,
  onBoostAgain,
  onContinuePayment,
  groupExtensions = false,
  emptyMessage = "No boost campaigns yet. Purchase a plan above to get started.",
}: Props) {
  const [detailsCampaign, setDetailsCampaign] = useState<BoostCampaignGroupRow | null>(null);
  const displayRows: BoostCampaignGroupRow[] = groupExtensions
    ? groupVendorCampaignRows(rows)
    : rows.map((row) => ({ ...row, history: [], extension_count: 0, total_duration_days: row.duration_days }));

  const activeCount = displayRows.filter((r) => r.display_status === "active").length;
  const showViewsEnquiries = vendorActions || showPerformanceMetrics;
  const resolvedSubtitle =
    subtitle ??
    (vendorActions
      ? activeCount > 0
        ? `${activeCount} Campaign${activeCount === 1 ? "" : "s"} Running`
        : "No active campaigns"
      : showPerformanceMetrics
        ? activeCount > 0
          ? `${activeCount} active · live profile views & lead messages`
          : "All vendor boost campaigns"
        : activeCount > 0
          ? `${activeCount} active`
          : "History & pending requests");

  const locationLabel = (row: BoostCampaignRow) => {
    const lga = row.location?.lga;
    const state = row.location?.state;
    if (lga && state) return `${lga}, ${state}`;
    return row.location?.label ?? "—";
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <span className="text-sm font-medium text-gray-400">{resolvedSubtitle}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin text-brand-red" aria-label="Loading campaigns" />
        </div>
      ) : displayRows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">
                  {showVendorColumn ? "Business / Vendor" : "Business / LGA"}
                </th>
                <th className="px-4 pb-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Tier
                </th>
                <th className="px-4 pb-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Duration left
                </th>
                {showViewsEnquiries ? (
                  <>
                    <th className="px-4 pb-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">
                      Views
                    </th>
                    <th className="px-4 pb-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">
                      Enquiries
                    </th>
                  </>
                ) : null}
                {!vendorActions ? (
                  <th className="px-4 pb-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Amount
                  </th>
                ) : null}
                <th className="px-4 pb-3 text-left text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Status
                </th>
                {showDetailsAction || vendorActions ? (
                  <th className="px-4 pb-3 text-right text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Actions
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRows.map((row) => {
                const canExtend = row.can_extend ?? row.display_status === "active";
                const canBoostAgain = row.can_boost_again ?? row.display_status === "expired";

                const isActiveRow = row.display_status === "active";
                const isExpiredRow = row.display_status === "expired";
                const isAwaitingPaymentRow = row.display_status === "pending_payment";
                const isPendingAdminRow = row.display_status === "pending_admin";
                const isPendingRow = isAwaitingPaymentRow || isPendingAdminRow;
                const canContinuePayment =
                  row.can_continue_payment ?? row.display_status === "pending_payment";

                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "transition-colors hover:bg-gray-50",
                      isActiveRow && "bg-emerald-50/60",
                      isExpiredRow && "bg-pink-50/40",
                      isAwaitingPaymentRow && "bg-sky-50/70",
                      isPendingAdminRow && "bg-amber-50/50",
                    )}
                  >
                    <td className="py-4 pr-4">
                      <div className="font-medium text-gray-800">
                        {row.business?.business_name ?? "—"}
                      </div>
                      {showVendorColumn && row.business?.vendor_name ? (
                        <div className="text-xs text-gray-500">{row.business.vendor_name}</div>
                      ) : null}
                      <div className="text-xs text-gray-400">{locationLabel(row)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-wide",
                            tierBadgeClasses(row.tier_badge),
                          )}
                        >
                          {row.tier_badge}
                        </span>
                        {isActiveRow ? (
                          <span className="inline-flex rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                            Active
                          </span>
                        ) : null}
                        {isPendingRow ? (
                          <span className="inline-flex rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                            Pending
                          </span>
                        ) : null}
                        {row.extension_count > 0 ? (
                          <span className="inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-800">
                            +{row.extension_count} extend
                          </span>
                        ) : null}
                      </div>
                      {!vendorActions ? (
                        <p className="mt-1 text-[11px] text-gray-500">{row.tier_label}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 font-medium text-gray-600">
                      {row.display_status === "active" || row.display_status === "expired" ? (
                        <>
                          <div>{row.duration_left_label ?? "—"}</div>
                          {!vendorActions ? (
                            <div className="text-[11px] font-normal text-gray-400">
                              {row.duration_days} day plan
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <span>{row.duration_days} days (awaiting activation)</span>
                      )}
                    </td>
                    {showViewsEnquiries ? (
                      <>
                        <td className="px-4 py-4 font-medium text-gray-600">
                          {formatCompactCount(row.views_count ?? 0)}
                        </td>
                        <td className="px-4 py-4 font-medium text-gray-600">
                          {row.enquiries_count ?? 0}
                        </td>
                      </>
                    ) : null}
                    {!vendorActions ? (
                      <td className="px-4 py-4 font-medium text-gray-600">
                        {formatNaira(row.amount, { freeLabel: false })}
                      </td>
                    ) : null}
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                          vendorActions && row.display_status === "expired"
                            ? "bg-pink-100 text-pink-600"
                            : displayStatusClasses(row.display_status),
                          vendorActions && row.display_status === "active" && "uppercase",
                        )}
                      >
                        {row.display_status === "expired" && vendorActions
                          ? "Expired"
                          : row.display_status_label}
                      </span>
                    </td>
                    {showDetailsAction ? (
                      <td className="px-4 py-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailsCampaign(row)}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50"
                          >
                            <Eye className="size-3.5" />
                            Analytics
                          </button>
                          <Link
                            to={`/admin/boost-system/${row.id}`}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50"
                          >
                            Details
                          </Link>
                        </div>
                      </td>
                    ) : null}
                    {vendorActions ? (
                      <td className="px-4 py-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailsCampaign(row)}
                            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
                          >
                            <Eye className="size-3.5" />
                            Details
                          </button>
                          {canContinuePayment ? (
                            <button
                              type="button"
                              onClick={() => onContinuePayment?.(row)}
                              className="inline-flex rounded-full bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700"
                            >
                              Continue Payment
                            </button>
                          ) : canExtend ? (
                            <button
                              type="button"
                              onClick={() => onExtendBoost?.(row)}
                              className="inline-flex rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600"
                            >
                              Extend Boost
                            </button>
                          ) : canBoostAgain ? (
                            <button
                              type="button"
                              onClick={() => onBoostAgain?.(row)}
                              className="inline-flex rounded-full bg-pink-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-pink-600"
                            >
                              Boost Again
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <VendorBoostCampaignDetailsDialog
        campaign={detailsCampaign}
        onClose={() => setDetailsCampaign(null)}
      />
    </div>
  );
}
