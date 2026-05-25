import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { alert, showError, showSuccess } from "@/lib/sweetAlert";

import { FlagVerificationModal } from "@/components/Modal/FlagVerificationModal";
import {
  adminApproveVerification,
  adminDeleteVerification,
  adminFlagVerification,
  adminListVerifications,
  type AdminVerificationRow,
} from "@/features/verification/adminVerificationApi";

type VerificationStatus = "pending" | "approved" | "flagged";

function formatDate(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
}

function rowDisplayStatus(row: AdminVerificationRow): VerificationStatus | "flagged" {
  if (row.is_flagged) return "flagged";
  if (row.verification_status === "approved") return "approved";
  return "pending";
}

function statusClass(status: VerificationStatus | "flagged") {
  if (status === "approved") return "bg-green-100 text-green-700";
  if (status === "flagged") return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
}

function exportCsv(rows: AdminVerificationRow[]) {
  const headers = ["Business Name", "Category", "Status", "Submitted"];
  const csvLines = [
    headers.join(","),
    ...rows.map((row) =>
      [row.business_name, row.category?.name ?? "", row.verification_status_label, row.created_at]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];
  const blob = new Blob([`\uFEFF${csvLines.join("\r\n")}`], { type: "text/csv;charset=utf-8;" });
  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `verification-log-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export default function VerificationGrid() {
  const [rows, setRows] = useState<AdminVerificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("queue");
  const [flagTarget, setFlagTarget] = useState<AdminVerificationRow | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminListVerifications({
        verification_status: statusFilter === "all" ? undefined : statusFilter,
        per_page: 50,
      });
      setRows(result.items);
    } catch {
      showError("Could not load verification requests.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const todayKey = new Date().toDateString();
  const todaysVerified = useMemo(
    () =>
      rows.filter(
        (item) =>
          item.verification_status === "approved" &&
          item.verified_at &&
          new Date(item.verified_at).toDateString() === todayKey,
      ).length,
    [rows, todayKey],
  );

  const pendingCount = rows.filter(
    (r) => r.verification_status === "pending" && !r.is_flagged,
  ).length;

  const handleApprove = async (row: AdminVerificationRow) => {
    setActingId(row.id);
    try {
      const updated = await adminApproveVerification(row.id);
      showSuccess(`${row.business_name} and all documents approved.`);
      setRows((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? {
              ...item,
              verification_status: "approved",
              verification_status_label: updated.verification_status_label,
              is_approved: true,
              verified_at: updated.verified_at ?? item.verified_at,
            }
            : item,
        ),
      );
    } catch {
      showError("Could not approve verification.");
    } finally {
      setActingId(null);
    }
  };

  const handleDelete = async (row: AdminVerificationRow) => {
    const confirmed = await alert.confirmDelete(
      `verification for "${row.business_name}"`,
      "The vendor will no longer be verified.",
    );
    if (!confirmed) return;

    setActingId(row.id);
    try {
      await adminDeleteVerification(row.id);
      showSuccess(`${row.business_name} is no longer verified.`);
      await load();
    } catch {
      showError("Could not remove verification.");
    } finally {
      setActingId(null);
    }
  };

  const handleFlag = async (reason: string) => {
    if (!flagTarget) return;
    setActingId(flagTarget.id);
    try {
      await adminFlagVerification(flagTarget.id, reason);
      showSuccess(`${flagTarget.business_name} flagged.`);
      setFlagTarget(null);
      await load();
    } catch {
      showError("Could not flag verification.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold leading-tight text-ink-heading sm:text-3xl">Verifications</h1>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="cursor-pointer rounded-xl border border-border-gray bg-card px-3 py-2 text-sm"
        >
          <option value="queue">Pending &amp; approved</option>
          <option value="all">All</option>
          <option value="pending">Pending only</option>
          <option value="approved">Approved</option>
          <option value="flagged">Flagged</option>
        </select>
        <button
          type="button"
          onClick={() => exportCsv(rows)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border-gray bg-card px-4 py-2.5 text-sm font-semibold text-ink hover:bg-muted"
        >
          <Download className="size-4" />
          Export Log (CSV)
        </button>
      </div>

      <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <article className="rounded-xl border border-chat-border-subtle bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Pending queue</p>
          <p className="mt-1 text-4xl font-semibold leading-10 text-amber-600">{pendingCount}</p>
          <p className="mt-1 text-sm text-body-secondary">Awaiting admin review</p>
        </article>
        <article className="rounded-xl border border-chat-border-subtle bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Today&apos;s verified</p>
          <p className="mt-1 text-4xl font-semibold leading-10 text-ink">{todaysVerified}</p>
        </article>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-border-gray bg-card">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border-gray bg-muted/40">
              <th className="px-4 py-3 text-left text-xs font-semibold text-body-secondary">Business Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-body-secondary">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-body-secondary">Submitted</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-body-secondary">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-body-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-body-secondary">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-body-secondary">
                  No verification requests found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-border-light">
                  <td className="px-4 py-3 font-medium text-ink">{row.business_name}</td>
                  <td className="px-4 py-3 text-ink">{row.category?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-body-secondary">
                    {formatDate(row.submitted_at ?? row.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusClass(rowDisplayStatus(row))}`}
                    >
                      {row.verification_status_label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/verifications/${row.id}`}
                        className="cursor-pointer rounded-md border border-border-gray bg-card px-3 py-1.5 text-xs font-semibold text-ink hover:bg-muted"
                      >
                        Request Info
                      </Link>
                      {row.verification_status === "pending" && !row.is_flagged ? (
                        <>
                          <button
                            type="button"
                            disabled={actingId === row.id}
                            onClick={() => void handleApprove(row)}
                            className="cursor-pointer rounded-md bg-success px-3 py-1.5 text-xs font-semibold text-white hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={actingId === row.id}
                            onClick={() => setFlagTarget(row)}
                            className="cursor-pointer rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Flag
                          </button>
                        </>
                      ) : null}
                      {row.verification_status === "approved" ||
                        row.verification_status === "pending" ||
                        row.is_flagged ? (
                        <button
                          type="button"
                          disabled={actingId === row.id}
                          onClick={() => void handleDelete(row)}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Remove verification"
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <FlagVerificationModal
        open={flagTarget !== null}
        businessName={flagTarget?.business_name ?? ""}
        onClose={() => setFlagTarget(null)}
        onConfirm={handleFlag}
      />
    </div>
  );
}
