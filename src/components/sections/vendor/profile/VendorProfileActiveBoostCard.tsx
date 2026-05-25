import { Link } from "react-router-dom";

import {
  displayStatusClasses,
  formatCompactCount,
  tierBadgeClasses,
  type BoostCampaignRow,
} from "@/features/boost/boostCampaignTypes";
import type { VendorBoostPendingRequest } from "@/features/boost/vendorBoostApi";
import { formatNaira } from "@/lib/currency";
import { cn } from "@/lib/utils";

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

function PendingBoostRequestCard({ request }: { request: VendorBoostPendingRequest }) {
  return (
    <div className="rounded-lg border border-sky-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{request.tier_label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {request.duration_days} days · {formatNaira(request.amount, { freeLabel: false })}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
            request.can_continue_payment
              ? "bg-sky-100 text-sky-800"
              : "bg-amber-100 text-amber-800",
          )}
        >
          {request.status_label}
        </span>
      </div>
      {request.can_continue_payment ? (
        <Link
          to="/vendor/boost"
          className="mt-3 inline-block text-xs font-semibold text-sky-700 hover:underline"
        >
          Continue payment on Boost page →
        </Link>
      ) : null}
    </div>
  );
}

function ActiveCampaignCard({ campaign }: { campaign: BoostCampaignRow }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold",
              tierBadgeClasses(campaign.tier_badge),
            )}
          >
            {campaign.tier_badge}
          </span>
          <p className="text-sm font-semibold text-foreground">{campaign.tier_label}</p>
        </div>
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
            displayStatusClasses(campaign.display_status),
          )}
        >
          {campaign.display_status_label}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Plan duration</dt>
          <dd className="mt-0.5 font-medium text-foreground">{campaign.duration_days} days</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Time remaining</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {campaign.duration_left_label ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Amount paid</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {formatNaira(campaign.amount, { freeLabel: false })}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Profile views</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {formatCompactCount(campaign.views_count ?? 0)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Started</dt>
          <dd className="mt-0.5 font-medium text-foreground">{formatDate(campaign.starts_at)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Ends</dt>
          <dd className="mt-0.5 font-medium text-foreground">{formatDate(campaign.ends_at)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Enquiries</dt>
          <dd className="mt-0.5 font-medium text-foreground">{campaign.enquiries_count ?? 0}</dd>
        </div>
      </dl>

      {campaign.can_continue_payment ? (
        <Link
          to="/vendor/boost"
          className="mt-3 inline-block text-xs font-semibold text-sky-700 hover:underline"
        >
          Complete payment on Boost page →
        </Link>
      ) : null}
    </div>
  );
}

type Props = {
  campaigns: BoostCampaignRow[];
  pendingRequest: VendorBoostPendingRequest | null;
  locationLabel: string;
};

export function VendorProfileActiveBoostCard({ campaigns, pendingRequest, locationLabel }: Props) {
  const showPending =
    pendingRequest &&
    !campaigns.some((c) => c.tier_key === pendingRequest.tier_key);

  return (
    <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">Your boost on this listing</p>
          <p className="mt-1 text-xs text-muted-foreground">{locationLabel}</p>
        </div>
        <Link
          to="/vendor/boost"
          className="text-xs font-semibold text-sky-700 hover:underline"
        >
          Manage boost
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {campaigns.map((campaign) => (
          <ActiveCampaignCard key={campaign.id} campaign={campaign} />
        ))}
        {showPending && pendingRequest ? (
          <PendingBoostRequestCard request={pendingRequest} />
        ) : null}
      </div>
    </div>
  );
}
