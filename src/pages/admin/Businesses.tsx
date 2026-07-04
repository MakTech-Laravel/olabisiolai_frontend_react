import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Ban,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import { BusinessDetailsModal } from "@/components/Modal/BusinessDetailsModal";
import {
  changeAdminBusinessStatus,
  deleteAdminBusiness,
  fetchAdminBusinessList,
  startAdminVendorConversation,
  type AdminBusinessInfo,
  type AdminBusinessStatusApi,
  type AdminFilterOption,
} from "@/features/business/adminBusinessInfoApi";
import { alert, showError } from "@/lib/sweetAlert";

type Status = "active" | "inactive" | "suspended" | "pending";
type Verification = "none" | "pending" | "verified" | "flagged";
type Boost = "none" | "active";
type Business = AdminBusinessInfo;

const statusStyles: Record<Status, string> = {
  pending: "bg-orange-50 text-orange-500 border border-orange-200",
  active: "bg-green-50 text-green-600 border border-green-200",
  inactive: "bg-amber-50 text-amber-700 border border-amber-200",
  suspended: "bg-red-50 text-red-500 border border-red-200",
};

function statusLabel(status: Status): string {
  if (status === "inactive") return "Inactive";
  if (status === "suspended") return "Suspended";
  if (status === "active") return "Active";
  return "Pending";
}

function verificationLabel(verification: Verification): string {
  if (verification === "verified") return "Verified";
  if (verification === "none") return "Not applied";
  if (verification === "flagged") return "Flagged";
  return verification.charAt(0).toUpperCase() + verification.slice(1);
}

const verificationStyles: Record<Verification, string> = {
  none: "bg-gray-100 text-gray-600 border border-gray-200",
  pending: "bg-orange-50 text-orange-500 border border-orange-200",
  verified: "bg-green-50 text-green-600 border border-green-200",
  flagged: "bg-red-50 text-red-500 border border-red-200",
};

const boostStyles: Record<Boost, string> = {
  none: "bg-gray-100 text-gray-500 border border-gray-200",
  active: "bg-blue-50 text-blue-500 border border-blue-200",
};

const planStyles: Record<Business["plan"], string> = {
  free: "bg-gray-100 text-gray-600 border border-gray-200",
  premium: "bg-red-50 text-brand-red border border-red-200",
};

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
}

function SelectFilter({
  placeholder,
  value,
  onChange,
  options,
  disabled,
}: {
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
  options: AdminFilterOption[];
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-10 min-w-[130px] appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-8 text-sm text-gray-600 outline-none transition-colors hover:border-gray-300 focus:border-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="all">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

function nextApiStatusForToggle(current: Status): AdminBusinessStatusApi {
  return current === "active" ? "inactive" : "active";
}

export default function BusinessTable() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const perPage = 15;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [businessStatusFilter, setBusinessStatusFilter] = useState("all");
  const [boostFilter, setBoostFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openingChatBusinessId, setOpeningChatBusinessId] = useState<number | null>(null);
  const [actionBusinessId, setActionBusinessId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<"status" | "delete" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Business | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, verificationFilter, businessStatusFilter, categoryFilter, boostFilter, planFilter]);

  const listQueryKey = [
    "admin",
    "business-info",
    page,
    perPage,
    debouncedSearch,
    verificationFilter,
    businessStatusFilter,
    categoryFilter,
    boostFilter,
    planFilter,
  ] as const;

  const listQuery = useQuery({
    queryKey: listQueryKey,
    queryFn: () =>
      fetchAdminBusinessList({
        page,
        per_page: perPage,
        search: debouncedSearch || undefined,
        verification_status: verificationFilter,
        business_status: businessStatusFilter,
        category_id: categoryFilter === "all" ? undefined : Number(categoryFilter),
        boost_status: boostFilter,
        subscription_plan: planFilter,
      }),
  });

  const filterOptions = listQuery.data?.filterOptions;
  const categoryOptions = useMemo(
    () =>
      (filterOptions?.categories ?? []).map((c) => ({
        value: String(c.id),
        label: c.name,
      })),
    [filterOptions?.categories],
  );

  const hasActiveFilters =
    debouncedSearch.length > 0 ||
    verificationFilter !== "all" ||
    businessStatusFilter !== "all" ||
    categoryFilter !== "all" ||
    boostFilter !== "all" ||
    planFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setVerificationFilter("all");
    setBusinessStatusFilter("all");
    setCategoryFilter("all");
    setBoostFilter("all");
    setPlanFilter("all");
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AdminBusinessStatusApi }) =>
      changeAdminBusinessStatus(id, status),
    onSuccess: () => {
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "business-info"] });
      alert.crud.updated("Business status");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to update business status.";
      setActionError(message);
      showError(message);
    },
    onSettled: () => {
      setActionBusinessId(null);
      setActionType(null);
    },
  });

  const openVendorChatMutation = useMutation({
    mutationFn: (businessId: number) => startAdminVendorConversation(businessId),
    onSuccess: ({ conversationUuid }) => {
      navigate(`/admin/messages?c=${encodeURIComponent(conversationUuid)}`);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Could not open vendor chat.";
      showError(message);
    },
    onSettled: () => {
      setOpeningChatBusinessId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAdminBusiness(id),
    onSuccess: () => {
      setActionError(null);
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "business-info"] });
      alert.crud.deleted("Business profile");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to delete business profile.";
      setActionError(message);
      showError(message);
    },
    onSettled: () => {
      setActionBusinessId(null);
      setActionType(null);
    },
  });

  const handleStatusChange = (business: Business) => {
    setActionError(null);
    setActionBusinessId(business.id);
    setActionType("status");
    statusMutation.mutate({
      id: business.id,
      status: nextApiStatusForToggle(business.status),
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setActionError(null);
    setActionBusinessId(deleteTarget.id);
    setActionType("delete");
    deleteMutation.mutate(deleteTarget.id);
  };

  const businesses = listQuery.data?.items ?? [];
  const summary = listQuery.data?.summary;
  const pagination = listQuery.data?.pagination ?? {
    current_page: 1,
    per_page: perPage,
    last_page: 1,
    total: 0,
  };

  const errorMessage =
    listQuery.error instanceof Error && listQuery.error.message.trim()
      ? listQuery.error.message
      : "Failed to load business list.";

  const totalBusinesses = summary?.total ?? 0;
  const freeVendors = summary?.free_plan ?? 0;
  const premiumVendors = summary?.premium_plan ?? 0;
  const verificationRate =
    totalBusinesses === 0 ? 0 : Math.round(((summary?.approved_verification ?? 0) / totalBusinesses) * 100);
  const pendingReview = summary?.pending_verification ?? 0;

  const handleExport = () => {
    const headers = [
      "Business Name",
      "Vendor",
      "Vendor Email",
      "Category",
      "Type",
      "Location",
      "Status",
      "Verification",
      "Boost",
      "Plan",
      "Join Date",
    ];
    const rows = businesses.map((item) => [
      item.name,
      item.vendorName,
      item.vendorEmail,
      item.category,
      item.type,
      item.location,
      item.status,
      item.verification,
      item.boost,
      item.plan,
      formatDate(item.joinDate),
    ]);
    const csvRows = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const blob = new Blob([`\uFEFF${csvRows}`], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `businesses-export-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const lastPage = Math.max(1, pagination.last_page);
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

  const rangeFrom = pagination.total === 0 ? 0 : (pagination.current_page - 1) * pagination.per_page + 1;
  const rangeTo = Math.min(pagination.current_page * pagination.per_page, pagination.total);

  return (
    <>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold leading-tight text-ink-heading sm:text-3xl">Businesses</h1>
      </div>

      <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-xl border border-chat-border-subtle bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Total Businesses</p>
          <p className="mt-1 text-4xl font-semibold leading-10 text-ink">{totalBusinesses.toLocaleString()}</p>
          <p className="mt-1 text-xs font-medium text-success">+8%</p>
        </article>
        <article className="rounded-xl border border-chat-border-subtle bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Free Vendors</p>
          <p className="mt-1 text-4xl font-semibold leading-10 text-ink">{freeVendors.toLocaleString()}</p>
          <p className="mt-1 text-xs font-medium text-chat-accent">Plan: Free</p>
        </article>
        <article
          className={`rounded-xl border border-chat-border-subtle bg-card p-4 ${planFilter === "premium" ? "ring-2 ring-brand-red/30" : ""}`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Premium Vendors</p>
          <p className="mt-1 text-4xl font-semibold leading-10 text-ink">{premiumVendors.toLocaleString()}</p>
          <button
            type="button"
            onClick={() => setPlanFilter((current) => (current === "premium" ? "all" : "premium"))}
            className="mt-1 text-xs font-medium text-brand-red hover:underline"
          >
            {planFilter === "premium" ? "Clear premium filter" : "Filter premium vendors"}
          </button>
        </article>
        <article className="rounded-xl border border-chat-border-subtle bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Verification Rate</p>
          <p className="mt-1 text-4xl font-semibold leading-10 text-ink">{verificationRate}%</p>
          <p className="mt-1 text-xs font-medium text-amber-600">Stable</p>
        </article>
        <article className="rounded-xl border border-chat-border-subtle bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Pending Review</p>
          <p className="mt-1 text-4xl font-semibold leading-10 text-ink">{pendingReview.toLocaleString()}</p>
          <p className="mt-1 text-xs font-medium text-brand-red">Urgent</p>
        </article>
      </section>
      {listQuery.isError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}
      {actionError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      <div className="bg-gray-50 font-sans">
        <div className="mx-auto max-w-9xl rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search business, vendor name, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <SelectFilter
                placeholder="Plan"
                value={planFilter}
                onChange={setPlanFilter}
                options={filterOptions?.subscription_plans ?? []}
                disabled={listQuery.isLoading && !filterOptions}
              />
              <SelectFilter
                placeholder="Verification"
                value={verificationFilter}
                onChange={setVerificationFilter}
                options={filterOptions?.verification_statuses ?? []}
                disabled={listQuery.isLoading && !filterOptions}
              />
              <SelectFilter
                placeholder="Business status"
                value={businessStatusFilter}
                onChange={setBusinessStatusFilter}
                options={filterOptions?.business_statuses ?? []}
                disabled={listQuery.isLoading && !filterOptions}
              />
              <SelectFilter
                placeholder="Boost"
                value={boostFilter}
                onChange={setBoostFilter}
                options={filterOptions?.boost_statuses ?? []}
                disabled={listQuery.isLoading && !filterOptions}
              />
              <SelectFilter
                placeholder="All categories"
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={categoryOptions}
                disabled={listQuery.isLoading && categoryOptions.length === 0}
              />
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-10 items-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  Clear filters
                </button>
              ) : null}
              {listQuery.isFetching && !listQuery.isLoading ? (
                <Loader2 className="size-4 animate-spin text-gray-400" aria-hidden />
              ) : null}
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex h-10 items-center rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Export page (CSV)
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["SN", "Business Name", "Vendor", "Join Date", "Plan", "Status", "Verification", "Boost", "Actions"].map((h) => (
                    <th
                      key={h}
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-900 ${h === "Actions" ? "text-right" : ""}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {listQuery.isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-sm text-gray-500">
                      Loading businesses...
                    </td>
                  </tr>
                ) : null}
                {businesses.map((b, index) => (
                  <tr key={b.id} className="group hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-3.5 text-gray-900">{index + 1}</td>
                    <td className="px-6 py-3.5 font-medium text-gray-900 whitespace-nowrap">{b.name}</td>
                    <td className="px-6 py-3.5 text-gray-900">
                      <div className="max-w-[180px] truncate" title={b.vendorName}>
                        {b.vendorName}
                      </div>
                      {b.vendorEmail ? (
                        <div className="max-w-[180px] truncate text-xs text-gray-500" title={b.vendorEmail}>
                          {b.vendorEmail}
                        </div>
                      ) : null}
                    </td>
                    {/* <td className="px-6 py-3.5 text-gray-900">{b.category}</td>
                    <td className="px-6 py-3.5 text-gray-900">{b.location}</td> */}
                    <td className="px-6 py-3.5 text-gray-900 whitespace-nowrap">{formatDate(b.joinDate)}</td>
                    <td className="px-6 py-3.5">
                      <Badge
                        label={b.plan === "premium" ? "Premium" : "Free"}
                        className={planStyles[b.plan]}
                      />
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge label={statusLabel(b.status)} className={statusStyles[b.status]} />
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge
                        label={verificationLabel(b.verification)}
                        className={verificationStyles[b.verification]}
                      />
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge
                        label={b.boost === "active" ? "Active" : "None"}
                        className={boostStyles[b.boost]}
                      />
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="inline-flex h-8 items-center gap-1 rounded-md bg-brand-red px-3 text-xs font-semibold text-white transition-colors hover:bg-brand-red/90 disabled:opacity-60"
                          title={`Message ${b.name}`}
                          disabled={openingChatBusinessId === b.id}
                          onClick={() => {
                            setOpeningChatBusinessId(b.id);
                            openVendorChatMutation.mutate(b.id);
                          }}
                        >
                          {openingChatBusinessId === b.id ? (
                            <Loader2 className="size-3 animate-spin" aria-hidden />
                          ) : (
                            <ArrowUpRight className="size-3" aria-hidden />
                          )}
                          Message Business
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100"
                          title="View details"
                          onClick={() => {
                            setSelectedBusinessId(b.id);
                            setIsModalOpen(true);
                          }}
                        >
                          <Eye className="size-4" />
                        </button>
                        {b.status === "active" ? (
                          <button
                            type="button"
                            className="inline-flex h-8 w-9 items-center justify-center rounded-lg text-amber-600 transition-colors hover:bg-amber-50 disabled:opacity-50"
                            title="Suspend business"
                            disabled={actionBusinessId === b.id}
                            onClick={() => handleStatusChange(b)}
                          >
                            {actionBusinessId === b.id && actionType === "status" ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Ban className="size-4" />
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="inline-flex h-8 w-9 items-center justify-center rounded-lg text-green-600 transition-colors hover:bg-green-50 disabled:opacity-50"
                            title="Activate business"
                            disabled={actionBusinessId === b.id}
                            onClick={() => handleStatusChange(b)}
                          >
                            {actionBusinessId === b.id && actionType === "status" ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Check className="size-4" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          className="inline-flex h-8 w-9 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                          title="Delete business"
                          disabled={actionBusinessId === b.id}
                          onClick={() => setDeleteTarget(b)}
                        >
                          {actionBusinessId === b.id && actionType === "delete" ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!listQuery.isLoading && businesses.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-sm text-gray-500">
                      No businesses found for current search/filter.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
            <p className="text-xs text-gray-400">
              Showing {rangeFrom}-{rangeTo} of {pagination.total} businesses (page {pagination.current_page} of{" "}
              {lastPage})
            </p>
            <div className="flex flex-wrap items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.current_page <= 1 || listQuery.isFetching}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>

              {pageNumbers.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  disabled={listQuery.isFetching}
                  className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors ${pagination.current_page === p
                    ? "bg-gray-900 text-white"
                    : "border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={pagination.current_page >= lastPage || listQuery.isFetching}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <BusinessDetailsModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBusinessId(null);
        }}
        businessId={selectedBusinessId}
      />

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDeleteTarget(null)}>
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900">Delete business</h2>
            <p className="mt-2 text-sm text-gray-600">
              Delete <span className="font-semibold text-gray-900">{deleteTarget.name}</span>? This cannot be
              undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                onClick={() => handleConfirmDelete()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}