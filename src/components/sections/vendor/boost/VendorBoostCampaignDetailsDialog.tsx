import { X } from "lucide-react";
import {
  displayStatusClasses,
  formatCompactCount,
  tierBadgeClasses,
} from "@/features/boost/boostCampaignTypes";
import type { BoostCampaignGroupRow } from "@/features/boost/groupVendorCampaignRows";
import { formatNaira } from "@/lib/currency";
import { cn } from "@/lib/utils";

type Props = {
  campaign: BoostCampaignGroupRow | null;
  onClose: () => void;
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function VendorBoostCampaignDetailsDialog({ campaign, onClose }: Props) {
  if (!campaign) return null;

  const locationLabel =
    campaign.location?.lga && campaign.location?.state
      ? `${campaign.location.lga}, ${campaign.location.state}`
      : (campaign.location?.label ?? "—");

  const extensionEntries = [
    ...(campaign.extensions ?? []).map((entry, index) => ({
      key: `meta-${entry.request_id ?? index}`,
      label: "Extension approved",
      durationDays: entry.duration_days ?? 0,
      amount: entry.amount ?? 0,
      when: entry.approved_at,
      status: "Merged into campaign",
    })),
    ...campaign.history.map((row) => ({
      key: `row-${row.id}`,
      label: row.renew_type === "extend" ? "Extension payment" : row.tier_label,
      durationDays: row.duration_days,
      amount: row.amount,
      when: row.reviewed_at ?? row.created_at,
      status: row.display_status_label,
    })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close details"
        onClick={onClose}
      />
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="boost-campaign-details-title"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-100 bg-white px-6 py-4">
          <div>
            <h2 id="boost-campaign-details-title" className="text-lg font-semibold text-gray-900">
              Boost campaign details
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {campaign.business?.business_name ?? "—"} · {locationLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-6 px-6 py-5">
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tier</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-xs font-bold",
                    tierBadgeClasses(campaign.tier_badge),
                  )}
                >
                  {campaign.tier_badge}
                </span>
                <span className="text-sm font-medium text-gray-800">{campaign.tier_label}</span>
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Status</p>
              <span
                className={cn(
                  "mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                  displayStatusClasses(campaign.display_status),
                )}
              >
                {campaign.display_status_label}
              </span>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Duration left</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {campaign.duration_left_label ?? "—"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total plan days</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{campaign.total_duration_days}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Views</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {formatCompactCount(campaign.views_count ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Enquiries</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{campaign.enquiries_count ?? 0}</p>
            </div>
          </section>

          <section className="rounded-xl border border-gray-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Campaign window</p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Started</dt>
                <dd className="font-medium text-gray-900">{formatDate(campaign.starts_at)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Ends</dt>
                <dd className="font-medium text-gray-900">{formatDate(campaign.ends_at)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Primary payment</dt>
                <dd className="font-medium text-gray-900">
                  {formatNaira(campaign.amount, { freeLabel: false })}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Extensions</dt>
                <dd className="font-medium text-gray-900">{campaign.extension_count}</dd>
              </div>
            </dl>
          </section>

          {extensionEntries.length > 0 ? (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Extension history</h3>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Days</th>
                      <th className="px-4 py-2">Amount</th>
                      <th className="px-4 py-2">When</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {extensionEntries.map((entry) => (
                      <tr key={entry.key}>
                        <td className="px-4 py-3 font-medium text-gray-800">{entry.label}</td>
                        <td className="px-4 py-3 text-gray-600">{entry.durationDays}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {formatNaira(entry.amount, { freeLabel: false })}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(entry.when)}</td>
                        <td className="px-4 py-3 text-gray-600">{entry.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

