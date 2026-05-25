import { Flag, Loader2, Plus, Eye } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import {
  approveAdminBoostRequest,
  fetchAdminBoostWaitingList,
  flagAdminBoostRequest,
  type AdminBoostRequestRow,
} from "@/features/boost/adminBoostRequestsApi";
import { tierBadgeClasses } from "@/features/boost/boostCampaignTypes";
import { showError, showSuccess } from "@/lib/sweetAlert";
import { getLaravelErrorMessage } from "@/lib/laravelApiError";
import { formatNaira } from "@/lib/currency";
import { cn } from "@/lib/utils";

function WaitingCard({
  row,
  onAssign,
  onFlag,
  assigning,
  flagging,
}: {
  row: AdminBoostRequestRow;
  onAssign: (id: number) => void;
  onFlag: (id: number, flagged: boolean) => void;
  assigning: boolean;
  flagging: boolean;
}) {
  const canAssign = row.status === "pending_admin";
  const locationLabel = row.location?.label ?? row.location?.lga ?? "—";
  const categoryLine = row.business?.category_name ?? "—";

  return (
    <article
      className={cn(
        "rounded-xl border bg-background p-4",
        row.is_flagged ? "border-amber-400 ring-1 ring-amber-200" : "border-chat-border-subtle",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-ink">{row.business?.business_name ?? "Business"}</p>
            {row.is_flagged ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                Flagged
              </span>
            ) : null}
          </div>
          <p className="text-xs text-body-secondary">{categoryLine}</p>
          <p className="text-xs text-body-secondary">LGA: {locationLabel}</p>
          <p className="mt-1 text-xs text-chat-meta">
            {row.tier_label} · {row.duration_days} days · {formatNaira(row.amount, { freeLabel: false })}
          </p>
          <p className="text-xs text-chat-meta">Rank: #{row.waiting_rank ?? "—"}</p>
          <span
            className={cn(
              "mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
              tierBadgeClasses(row.tier_badge ?? "BRONZE"),
            )}
          >
            {row.tier_badge ?? row.tier_key}
          </span>
          <p className="mt-1 text-[11px] text-amber-700">{row.status_label}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          to={`/admin/boost-system/${row.id}`}
          className="inline-flex items-center gap-1 rounded-md border border-border-gray bg-card px-3 py-1.5 text-xs font-semibold text-ink hover:bg-muted"
        >
          <Eye className="size-3.5" />
          Details
        </Link>
        <button
          type="button"
          disabled={flagging}
          onClick={() => onFlag(row.id, !row.is_flagged)}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-semibold",
            row.is_flagged
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-border-gray text-ink hover:bg-muted",
          )}
        >
          <Flag className="size-3.5" />
          {row.is_flagged ? "Unflag" : "Flag"}
        </button>
        <button
          type="button"
          disabled={!canAssign || assigning}
          title={canAssign ? "Approve and activate boost" : "Payment must complete before assign"}
          onClick={() => onAssign(row.id)}
          className="inline-flex items-center gap-1 rounded-md bg-success px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-3.5" />
          Assign
        </button>
      </div>
    </article>
  );
}

export function BoostWaitingList() {
  const queryClient = useQueryClient();

  const { data: waiting = [], isPending } = useQuery({
    queryKey: ["admin", "boost-requests", "waiting"],
    queryFn: fetchAdminBoostWaitingList,
    staleTime: 10_000,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "boost-requests"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "boost-requests", "campaigns"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "boost-requests", "waiting"] });
  };

  const assignMutation = useMutation({
    mutationFn: (id: number) => approveAdminBoostRequest(id),
    onSuccess: (result) => {
      invalidate();
      showSuccess(result.message || "Boost is live now from this moment.");
    },
    onError: (error: unknown) => showError(getLaravelErrorMessage(error, "Assign failed.")),
  });

  const flagMutation = useMutation({
    mutationFn: ({ id, flagged }: { id: number; flagged: boolean }) =>
      flagAdminBoostRequest(id, flagged),
    onSuccess: (_, { flagged }) => {
      invalidate();
      showSuccess(flagged ? "Request flagged for review." : "Flag removed.");
    },
    onError: (error: unknown) => showError(getLaravelErrorMessage(error, "Could not update flag.")),
  });

  return (
    <section className="rounded-2xl border border-chat-border-subtle bg-card p-4">
      <h3 className="mb-1 text-base font-semibold text-ink">Waiting List</h3>
      <p className="mb-3 text-sm text-chat-meta">
        Pending boost requests. Assign activates the boost; flag marks items that need extra review.
      </p>

      {isPending ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-7 animate-spin text-chat-accent" aria-label="Loading waiting list" />
        </div>
      ) : waiting.length === 0 ? (
        <p className="py-8 text-center text-sm text-chat-meta">No pending boost requests in the queue.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {waiting.map((row) => (
            <WaitingCard
              key={row.id}
              row={row}
              onAssign={(id) => assignMutation.mutate(id)}
              onFlag={(id, flagged) => flagMutation.mutate({ id, flagged })}
              assigning={assignMutation.isPending}
              flagging={flagMutation.isPending}
            />
          ))}
        </div>
      )}
    </section>
  );
}
