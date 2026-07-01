import { Download, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { BoostWaitingList } from "@/components/sections/admin/boost/BoostWaitingList";
import { VendorBoostCampaignsTable } from "@/components/sections/vendor/boost/VendorBoostCampaignsTable";
import { fetchAdminBoostCampaigns } from "@/features/boost/adminBoostRequestsApi";
import { groupVendorCampaignRows } from "@/features/boost/groupVendorCampaignRows";
import { formatCompactCount } from "@/features/boost/boostCampaignTypes";
import { formatNaira } from "@/lib/currency";

export default function BoostSystem() {
  const { data: campaigns = [], isPending: campaignsLoading } = useQuery({
    queryKey: ["admin", "boost-requests", "campaigns"],
    queryFn: () => fetchAdminBoostCampaigns(),
    staleTime: 15_000,
  });

  const groupedCampaigns = useMemo(() => groupVendorCampaignRows(campaigns), [campaigns]);

  const activeCampaigns = useMemo(
    () => groupedCampaigns.filter((row) => row.display_status === "active"),
    [groupedCampaigns],
  );

  const overview = useMemo(() => {
    const totalViews = activeCampaigns.reduce((sum, row) => sum + (row.views_count ?? 0), 0);
    const totalEnquiries = activeCampaigns.reduce((sum, row) => sum + (row.enquiries_count ?? 0), 0);
    const paidCampaigns = groupedCampaigns.filter(
      (row) =>
        row.status === "approved" ||
        row.display_status === "active" ||
        row.display_status === "expired",
    );
    const totalRevenue = paidCampaigns.reduce((sum, row) => sum + row.amount, 0);
    const avgDuration =
      paidCampaigns.length > 0
        ? Math.round(paidCampaigns.reduce((sum, row) => sum + row.duration_days, 0) / paidCampaigns.length)
        : 0;

    return {
      activeCount: activeCampaigns.length,
      totalViews,
      totalEnquiries,
      totalRevenue,
      avgDuration,
      pendingCount: groupedCampaigns.filter((row) => row.status === "pending_admin").length,
    };
  }, [activeCampaigns, groupedCampaigns]);

  function exportTrackingCsv() {
    const headers = [
      "Business",
      "Vendor",
      "LGA",
      "Tier",
      "Status",
      "Duration Days",
      "Views",
      "Enquiries",
      "Amount",
      "Starts",
      "Ends",
    ];
    const csvLines = [
      headers.join(","),
      ...groupedCampaigns.map((row) =>
        [
          row.business?.business_name ?? "",
          row.business?.vendor_name ?? "",
          row.location?.lga ?? "",
          row.tier_label,
          row.display_status_label,
          row.duration_days,
          row.views_count ?? 0,
          row.enquiries_count ?? 0,
          row.amount,
          row.starts_at ?? "",
          row.ends_at ?? "",
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ];
    const blob = new Blob([`\uFEFF${csvLines.join("\r\n")}`], { type: "text/csv;charset=utf-8;" });
    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `boost-campaigns-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold leading-tight text-ink-heading sm:text-3xl">Boost System</h1>
          <p className="mt-1 max-w-2xl text-sm text-chat-meta">
            Review vendor campaigns, approve pending boosts, and track performance. Manage which LGAs vendors can
            boost in from the Locations page.
          </p>
        </div>
        <Link
          to="/admin/locations"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border-gray bg-background px-3 py-2 text-sm font-medium text-ink hover:bg-muted"
        >
          <MapPin className="size-4 text-chat-accent" />
          Manage boost locations
        </Link>
      </div>

      <section className="rounded-2xl border border-chat-border-subtle bg-card p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-chat-accent">Overview</p>
        <p className="mt-0.5 text-sm text-chat-meta">
          Live metrics from profile visits and customer messages during active campaigns.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <article className="rounded-xl border border-chat-border-subtle bg-background p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-chat-meta">Active boosts</p>
            <p className="mt-1 text-3xl font-semibold leading-9 text-ink sm:text-4xl">{overview.activeCount}</p>
          </article>
          <article className="rounded-xl border border-chat-border-subtle bg-background p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-chat-meta">Pending review</p>
            <p className="mt-1 text-3xl font-semibold leading-9 text-ink sm:text-4xl">{overview.pendingCount}</p>
          </article>
          <article className="rounded-xl border border-chat-border-subtle bg-background p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-chat-meta">Profile views</p>
            <p className="mt-1 text-3xl font-semibold leading-9 text-ink sm:text-4xl">
              {formatCompactCount(overview.totalViews)}
            </p>
          </article>
          <article className="rounded-xl border border-chat-border-subtle bg-background p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-chat-meta">Enquiries</p>
            <p className="mt-1 text-3xl font-semibold leading-9 text-ink sm:text-4xl">{overview.totalEnquiries}</p>
          </article>
          <article className="col-span-2 rounded-xl border border-chat-border-subtle bg-background p-3 lg:col-span-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-chat-meta">Revenue</p>
            <p className="mt-1 text-2xl font-semibold leading-9 text-ink sm:text-3xl">
              {formatNaira(overview.totalRevenue, { freeLabel: false })}
            </p>
            <p className="text-xs text-body-secondary">Avg {overview.avgDuration} days</p>
          </article>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={exportTrackingCsv}
          disabled={groupedCampaigns.length === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-border-gray bg-background px-3 py-2 text-xs font-semibold text-ink hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="size-4" />
          Export campaigns CSV
        </button>
      </div>

      <VendorBoostCampaignsTable
        rows={campaigns}
        loading={campaignsLoading}
        title="Boost campaigns"
        subtitle="All vendor boost campaigns across active and past runs."
        showVendorColumn
        showPerformanceMetrics
        showDetailsAction
        groupExtensions
        emptyMessage="No vendor boost campaigns yet."
      />

      <BoostWaitingList />
    </div>
  );
}
