import type { ReactNode } from "react";
import { ArrowLeft, Flag, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  approveAdminBoostRequest,
  fetchAdminBoostRequestDetail,
  flagAdminBoostRequest,
  rejectAdminBoostRequest,
} from "@/features/boost/adminBoostRequestsApi";
import {
  displayStatusClasses,
  formatCompactCount,
  tierBadgeClasses,
} from "@/features/boost/boostCampaignTypes";
import { showError, showSuccess } from "@/lib/sweetAlert";
import { getLaravelErrorMessage } from "@/lib/laravelApiError";
import { formatNaira } from "@/lib/currency";
import { cn } from "@/lib/utils";

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function projectedEndFromNow(durationDays: number): string {
  const end = new Date();
  end.setDate(end.getDate() + durationDays);
  return end.toLocaleString();
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border-light py-2.5 sm:flex-row sm:items-start sm:justify-between">
      <dt className="text-xs font-semibold uppercase tracking-wide text-chat-meta">{label}</dt>
      <dd className="text-sm text-ink sm:max-w-[65%] sm:text-right">{value ?? "—"}</dd>
    </div>
  );
}

export default function AdminBoostRequestDetail() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const id = Number(requestId);

  const { data, isPending, isError } = useQuery({
    queryKey: ["admin", "boost-requests", "detail", id],
    queryFn: () => fetchAdminBoostRequestDetail(id),
    enabled: Number.isFinite(id) && id > 0,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "boost-requests"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "boost-requests", "waiting"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "boost-requests", "campaigns"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "boost-requests", "detail", id] });
  };

  const approveMutation = useMutation({
    mutationFn: () => approveAdminBoostRequest(id),
    onSuccess: (result) => {
      invalidate();
      showSuccess(result.message || "Boost is live now from this moment.");
      navigate("/admin/boost-system");
    },
    onError: (error: unknown) => showError(getLaravelErrorMessage(error, "Assign failed.")),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectAdminBoostRequest(id),
    onSuccess: () => {
      invalidate();
      showSuccess("Boost request rejected.");
      navigate("/admin/boost-system");
    },
    onError: (error: unknown) => showError(getLaravelErrorMessage(error, "Reject failed.")),
  });

  const flagMutation = useMutation({
    mutationFn: (flagged: boolean) => flagAdminBoostRequest(id, flagged),
    onSuccess: (_, flagged) => {
      invalidate();
      showSuccess(flagged ? "Request flagged." : "Flag removed.");
    },
    onError: (error: unknown) => showError(getLaravelErrorMessage(error, "Could not update flag.")),
  });

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <p className="p-6 text-sm text-destructive">Invalid boost request id.</p>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <Link
        to="/admin/boost-system"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-chat-accent hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to Boost System
      </Link>

      {isPending ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-8 animate-spin text-chat-accent" aria-label="Loading" />
        </div>
      ) : isError || !data ? (
        <p className="text-sm text-destructive">Could not load boost request details.</p>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-ink-heading">
                {data.business_detail?.business_name ?? data.business?.business_name ?? "Boost request"}
              </h1>
              <p className="mt-1 text-sm text-chat-meta">
                Request #{data.id} · {data.tier_label} · {data.duration_days} days
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-xs font-bold",
                    tierBadgeClasses(data.tier_badge ?? "BRONZE"),
                  )}
                >
                  {data.tier_badge}
                </span>
                <span
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase",
                    displayStatusClasses(data.display_status ?? data.status),
                  )}
                >
                  {data.display_status_label ?? data.status_label}
                </span>
                {data.is_flagged ? (
                  <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    Flagged
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={flagMutation.isPending}
                onClick={() => flagMutation.mutate(!data.is_flagged)}
                className="inline-flex items-center gap-1 rounded-lg border border-border-gray px-4 py-2 text-sm font-semibold text-ink hover:bg-muted"
              >
                <Flag className="size-4" />
                {data.is_flagged ? "Unflag" : "Flag"}
              </button>
              {data.status === "pending_admin" ? (
                <>
                  <button
                    type="button"
                    disabled={rejectMutation.isPending}
                    onClick={() => rejectMutation.mutate()}
                    className="rounded-lg border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={approveMutation.isPending}
                    onClick={() => approveMutation.mutate()}
                    className="rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white"
                  >
                    Assign & activate
                  </button>
                </>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-chat-border-subtle bg-card p-4">
              <h2 className="mb-3 text-base font-semibold text-ink">Boost request</h2>
              <dl>
                <DetailRow label="Plan" value={data.tier_label} />
                <DetailRow
                  label="Duration"
                  value={`${data.duration_days} day${data.duration_days === 1 ? "" : "s"}`}
                />
                <DetailRow label="Amount" value={formatNaira(data.amount, { freeLabel: false })} />
                <DetailRow label="Location" value={data.location?.label ?? data.location?.lga} />
                <DetailRow label="Submitted" value={data.created_at ? new Date(data.created_at).toLocaleString() : "—"} />
                <DetailRow
                  label="Starts"
                  value={
                    data.starts_at
                      ? formatDateTime(data.starts_at)
                      : data.starts_on_assign
                        ? "Immediately when you assign (same moment)"
                        : "—"
                  }
                />
                <DetailRow
                  label="Ends"
                  value={
                    data.ends_at
                      ? formatDateTime(data.ends_at)
                      : data.starts_on_assign
                        ? projectedEndFromNow(data.duration_days)
                        : data.projected_ends_at
                          ? formatDateTime(data.projected_ends_at)
                          : "—"
                  }
                />
                <DetailRow label="Admin note" value={data.admin_note} />
              </dl>
            </section>

            <section className="rounded-2xl border border-chat-border-subtle bg-card p-4">
              <h2 className="mb-3 text-base font-semibold text-ink">Vendor</h2>
              <dl>
                <DetailRow label="Name" value={data.vendor?.name} />
                <DetailRow label="Email" value={data.vendor?.email} />
                <DetailRow label="Phone" value={data.vendor?.phone} />
              </dl>
            </section>

            <section className="rounded-2xl border border-chat-border-subtle bg-card p-4 lg:col-span-2">
              <h2 className="mb-3 text-base font-semibold text-ink">Business</h2>
              <dl>
                <DetailRow label="Category" value={data.business_detail?.category?.name} />
                <DetailRow label="Phone" value={data.business_detail?.phone} />
                <DetailRow label="WhatsApp" value={data.business_detail?.whatsapp} />
                <DetailRow label="Website" value={data.business_detail?.website} />
                <DetailRow label="Verification" value={data.business_detail?.verification_status} />
                <DetailRow label="Status" value={data.business_detail?.business_status} />
                <DetailRow
                  label="Description"
                  value={
                    <span className="block text-left sm:text-right">
                      {data.business_detail?.business_description ?? "—"}
                    </span>
                  }
                />
                <DetailRow
                  label="Services"
                  value={
                    data.business_detail?.services_offered?.length
                      ? data.business_detail.services_offered.join(", ")
                      : "—"
                  }
                />
              </dl>
            </section>

            <section className="rounded-2xl border border-chat-border-subtle bg-card p-4 lg:col-span-2">
              <h2 className="mb-3 text-base font-semibold text-ink">Campaign performance</h2>
              <p className="mb-3 text-xs text-chat-meta">
                Counted during the active campaign window — profile visits and customer messages to this vendor.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border-light bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Profile views</p>
                  <p className="mt-1 text-2xl font-semibold text-ink">
                    {formatCompactCount(data.views_count ?? 0)}
                  </p>
                </div>
                <div className="rounded-xl border border-border-light bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Enquiries</p>
                  <p className="mt-1 text-2xl font-semibold text-ink">{data.enquiries_count ?? 0}</p>
                </div>
              </div>
            </section>

            {data.payment ? (
              <section className="rounded-2xl border border-chat-border-subtle bg-card p-4 lg:col-span-2">
                <h2 className="mb-3 text-base font-semibold text-ink">Payment</h2>
                <dl>
                  <DetailRow label="Reference" value={data.payment.tx_ref} />
                  <DetailRow label="Amount" value={formatNaira(data.payment.amount, { freeLabel: false })} />
                  <DetailRow label="Status" value={data.payment.status} />
                  <DetailRow
                    label="Paid at"
                    value={data.payment.paid_at ? new Date(data.payment.paid_at).toLocaleString() : "—"}
                  />
                </dl>
              </section>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
