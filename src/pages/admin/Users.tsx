import {
  Ban,
  BriefcaseBusiness,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Download,
  Eye,
  Loader2,
  Search,
  ShieldUser,
  Trash2,
  UserPlus,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  UserDetailsModal,
  type UserAccountProfile,
  type UserDetailsRow,
  type UserRole,
  type VendorBusinessProfile,
} from "@/components/Modal/UserDetailsModal";
import { request } from "@/api/request";
import { alert, showError, showSuccess } from "@/lib/sweetAlert";

type UserRow = UserDetailsRow & {
  id: number;
};
type StatusFilter = "all" | UserRow["status"];
type RoleFilter = "all" | UserRole;

type UsersApiEnvelope = {
  data?: unknown;
  message?: string;
};

type UsersSummaryCounts = {
  allUsers: number;
  totalUsers: number;
  totalVendors: number;
  totalAdmins: number;
  newSignups: number;
};

type UsersPagination = {
  current_page: number;
  per_page: number;
  last_page: number;
  total: number;
};

const DEFAULT_PER_PAGE = 10;
const EXPORT_PER_PAGE = 100;

const SUPPORTED_ROLES: UserRole[] = ["user", "vendor", "admin"];

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function getNestedData(body: unknown): unknown {
  const root = toRecord(body);
  if (!root) return body;
  if ("data" in root) return root.data;
  return body;
}

function pickUsersArray(body: unknown): unknown[] {
  const data = getNestedData(body);

  if (Array.isArray(data)) return data;

  const dataRecord = toRecord(data);
  if (!dataRecord) return [];

  if (Array.isArray(dataRecord.data)) return dataRecord.data;
  if (Array.isArray(dataRecord.users)) return dataRecord.users;
  if (Array.isArray(dataRecord.items)) return dataRecord.items;

  return [];
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function parseUsersPagination(body: unknown): UsersPagination {
  const data = toRecord(getNestedData(body));
  const pagination = toRecord(data?.pagination);
  return {
    current_page: Math.max(1, toNumber(pagination?.current_page) ?? 1),
    per_page: Math.max(1, toNumber(pagination?.per_page) ?? DEFAULT_PER_PAGE),
    last_page: Math.max(1, toNumber(pagination?.last_page) ?? 1),
    total: Math.max(0, toNumber(pagination?.total) ?? toNumber(data?.count) ?? 0),
  };
}

function toStatus(value: unknown): UserRow["status"] {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "active") return "active";
    if (normalized === "pending") return "pending";
    if (normalized === "block" || normalized === "blocked" || normalized === "inactive") return "blocked";
  }
  return "active";
}

function toApiStatus(status: StatusFilter): string | undefined {
  if (status === "all") return undefined;
  if (status === "blocked") return "block";
  return status;
}

function toDateLabel(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
}

function toDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function toRole(value: unknown): UserRole {
  if (typeof value !== "string") return "user";
  const normalized = value.trim().toLowerCase();
  if (SUPPORTED_ROLES.includes(normalized as UserRole)) return normalized as UserRole;
  return "user";
}

function mapUserProfile(raw: Record<string, unknown> | null): UserAccountProfile | null {
  if (!raw) return null;
  return {
    first_name: raw.first_name != null ? String(raw.first_name) : undefined,
    last_name: raw.last_name != null ? String(raw.last_name) : undefined,
    name: raw.name != null ? String(raw.name) : undefined,
    email: raw.email != null ? String(raw.email) : undefined,
    phone: raw.phone != null ? String(raw.phone) : null,
    location: raw.location != null ? String(raw.location) : null,
    image_url: raw.image_url != null ? String(raw.image_url) : null,
    wants_marketing_emails:
      raw.wants_marketing_emails === true || raw.wants_marketing_emails === 1,
    email_verified_at:
      raw.email_verified_at != null ? String(raw.email_verified_at) : null,
    created_at: raw.created_at != null ? String(raw.created_at) : null,
    updated_at: raw.updated_at != null ? String(raw.updated_at) : null,
  };
}

function mapVendorProfile(raw: unknown): VendorBusinessProfile | null {
  const item = toRecord(raw);
  if (!item) return null;
  const category = toRecord(item.category);
  const location = toRecord(item.location);
  return {
    id: toNumber(item.id) ?? undefined,
    business_name: item.business_name != null ? String(item.business_name) : undefined,
    business_description:
      item.business_description != null ? String(item.business_description) : null,
    phone: item.phone != null ? String(item.phone) : null,
    whatsapp: item.whatsapp != null ? String(item.whatsapp) : null,
    website: item.website != null ? String(item.website) : null,
    verification_status:
      item.verification_status != null ? String(item.verification_status) : undefined,
    business_status:
      item.business_status != null ? String(item.business_status) : undefined,
    is_premium: item.is_premium === true,
    subscription_plan:
      item.subscription_plan != null ? String(item.subscription_plan) : null,
    average_rating: toNumber(item.average_rating) ?? undefined,
    reviews_count: toNumber(item.reviews_count) ?? undefined,
    logo_url: item.logo_url != null ? String(item.logo_url) : null,
    category: category ? { name: category.name != null ? String(category.name) : undefined } : null,
    location: location
      ? {
          full_name: location.full_name != null ? String(location.full_name) : undefined,
          name: location.name != null ? String(location.name) : undefined,
          state: location.state != null ? String(location.state) : undefined,
        }
      : null,
    created_at: item.created_at != null ? String(item.created_at) : null,
  };
}

function mapApiUser(raw: unknown, index: number): UserRow {
  const rawRecord = toRecord(raw) ?? {};
  const item = toRecord(rawRecord.user) ?? rawRecord;
  const id = toNumber(item.user_id ?? item.id) ?? index + 1;
  const userProfileNested = mapUserProfile(toRecord(item.user_profile));
  const userProfileFromRoot = mapUserProfile(item);
  const vendorRaw = item.vendor_profile ?? item.vendorProfile;

  return {
    id,
    uuid: item.uuid != null ? String(item.uuid) : undefined,
    name: String(item.name ?? item.full_name ?? item.username ?? "-"),
    phone: String(item.phone ?? item.mobile ?? item.phone_number ?? "-"),
    email: String(item.email ?? "-"),
    role: toRole(item.role ?? item.user_role),
    status: toStatus(item.status),
    joinDate: toDateLabel(item.created_at ?? item.join_date ?? item.joinDate),
    userProfile: userProfileNested ?? userProfileFromRoot,
    vendorProfile: mapVendorProfile(vendorRaw),
  };
}

async function postToAnyAdminUsersEndpoint<TResponse>(
  paths: string[],
  body: Record<string, unknown>,
) {
  let lastError: unknown = null;
  for (const path of paths) {
    try {
      return await request.post<TResponse>(path, body);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function pickSummaryInt(record: Record<string, unknown>, snake: string, camel: string): number {
  const fromSnake = toNumber(record[snake]);
  if (fromSnake !== null) return fromSnake;
  const fromCamel = toNumber(record[camel]);
  return fromCamel ?? 0;
}

function parseUsersSummary(body: unknown): UsersSummaryCounts | null {
  const nested = getNestedData(body);
  const record = toRecord(nested);
  if (!record) return null;
  const summary = toRecord(record.summary);
  if (!summary) return null;

  return {
    allUsers: pickSummaryInt(summary, "all_users", "allUsers"),
    totalUsers: pickSummaryInt(summary, "total_users", "totalUsers"),
    totalVendors: pickSummaryInt(summary, "total_vendors", "totalVendors"),
    totalAdmins: pickSummaryInt(summary, "total_admins", "totalAdmins"),
    newSignups: pickSummaryInt(summary, "new_signups", "newSignups"),
  };
}

function statusClass(status: UserRow["status"]) {
  if (status === "active") return "bg-success/10 text-success";
  if (status === "pending") return "bg-amber-100 text-amber-600";
  return "bg-tint-red text-brand-red";
}

function roleClass(role: UserRole) {
  if (role === "admin") return "bg-tint-red text-brand-red";
  if (role === "vendor") return "bg-amber-100 text-amber-600";
  return "bg-surface-soft text-chat-accent";
}

function limitText(value: string, max = 24) {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

function buildUsersListPayload(params: {
  page: number;
  perPage: number;
  search?: string;
  roleFilter: RoleFilter;
  statusFilter: StatusFilter;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    page: params.page,
    per_page: params.perPage,
  };
  if (params.search) body.search = params.search;
  if (params.roleFilter !== "all") body.role = params.roleFilter;
  const apiStatus = toApiStatus(params.statusFilter);
  if (apiStatus) body.status = apiStatus;
  return body;
}

async function fetchAllAdminUsersForExport(): Promise<(UserRow & { sn: number })[]> {
  let page = 1;
  let lastPage = 1;
  const items: UserRow[] = [];

  do {
    const res = await postToAnyAdminUsersEndpoint<UsersApiEnvelope>(
      ["/api/v1/admin/users", "/admin/users"],
      { page, per_page: EXPORT_PER_PAGE },
    );
    items.push(...pickUsersArray(res.data).map(mapApiUser));
    lastPage = parseUsersPagination(res.data).last_page;
    page += 1;
  } while (page <= lastPage);

  return items.map((user, index) => ({ ...user, sn: index + 1 }));
}

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionUserId, setActionUserId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<"view" | "status" | "delete" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [summaryCounts, setSummaryCounts] = useState<UsersSummaryCounts | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage] = useState(DEFAULT_PER_PAGE);
  const [pagination, setPagination] = useState<UsersPagination>({
    current_page: 1,
    per_page: DEFAULT_PER_PAGE,
    last_page: 1,
    total: 0,
  });
  const [exporting, setExporting] = useState(false);

  const fetchSummary = async () => {
    try {
      const res = await postToAnyAdminUsersEndpoint<UsersApiEnvelope>(
        ["/api/v1/admin/users/summary", "/admin/users/summary"],
        {},
      );
      const parsed = parseUsersSummary(res.data);
      if (parsed) setSummaryCounts(parsed);
    } catch (error) {
      console.error("Users summary fetch failed", error);
    }
  };

  const fetchUsers = async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const res = await postToAnyAdminUsersEndpoint<UsersApiEnvelope>(
        ["/api/v1/admin/users", "/admin/users"],
        buildUsersListPayload({
          page,
          perPage,
          search,
          roleFilter,
          statusFilter,
        }),
      );
      const list = pickUsersArray(res.data).map(mapApiUser);
      setUsers(list);
      setPagination(parseUsersPagination(res.data));
    } catch (error) {
      console.error("Users list fetch failed", error);
      setError("Failed to load users. Please check API path or payload.");
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchTerm.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    void fetchUsers();
  }, [page, perPage, roleFilter, statusFilter, search]);

  useEffect(() => {
    void fetchSummary();
  }, []);

  const statusLabel = statusFilter === "all" ? "Select Status" : statusFilter;
  const roleLabel = roleFilter === "all" ? "Select Role" : roleFilter;

  const summaryFallback = useMemo((): UsersSummaryCounts => {
    const threshold = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return {
      allUsers: pagination.total || users.length,
      totalUsers: users.filter((user) => user.role === "user").length,
      totalVendors: users.filter((user) => user.role === "vendor").length,
      totalAdmins: users.filter((user) => user.role === "admin").length,
      newSignups: users.filter((user) => {
        const parsed = toDate(user.joinDate);
        return parsed ? parsed.getTime() >= threshold : false;
      }).length,
    };
  }, [users, pagination.total]);

  const counts = summaryCounts ?? summaryFallback;
  const { allUsers, totalUsers, totalVendors, totalAdmins, newSignups } = counts;

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

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const allUsersRows = await fetchAllAdminUsersForExport();
      const headers = ["SN", "Name", "Phone", "Email", "Role", "Status", "Join Date"];
      const rows = allUsersRows.map((user) => ({
        SN: String(user.sn),
        Name: user.name,
        Phone: user.phone,
        Email: user.email,
        Role: user.role,
        Status: user.status,
        "Join Date": user.joinDate,
      }));
      const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
      const csvLines = [
        headers.join(","),
        ...rows.map((row) => headers.map((h) => escapeCell(String(row[h as keyof typeof row] ?? ""))).join(",")),
      ];
      const blob = new Blob([`\uFEFF${csvLines.join("\r\n")}`], {
        type: "text/csv;charset=utf-8;",
      });
      const now = new Date();
      const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `users-${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      showSuccess(`Exported ${allUsersRows.length} users.`);
    } catch (error) {
      console.error("Users export failed", error);
      showError("Failed to export users.");
    } finally {
      setExporting(false);
    }
  };

  const handleView = async (user: UserRow) => {
    setActionUserId(user.id);
    setActionType("view");
    setSelectedUser(user);
    setIsModalOpen(true);
    setDetailsLoading(true);
    try {
      const res = await postToAnyAdminUsersEndpoint<UsersApiEnvelope>(
        ["/api/v1/admin/users/view", "/admin/users/view"],
        {
          user_id: user.id,
        },
      );
      const viewPayload = getNestedData(res.data);
      const payloadRecord = toRecord(viewPayload);
      const userRecord = toRecord(payloadRecord?.user) ?? payloadRecord;
      const fullUser = mapApiUser(userRecord ?? viewPayload, 0);
      setSelectedUser({ ...user, ...fullUser, id: user.id });
    } catch {
      setSelectedUser(user);
    } finally {
      setDetailsLoading(false);
      setActionUserId(null);
      setActionType(null);
    }
  };

  const handleStatusChange = async (user: UserRow) => {
    const previousStatus = user.status;
    const nextStatus: UserRow["status"] = previousStatus === "active" ? "blocked" : "active";
    setActionUserId(user.id);
    setActionType("status");
    setUsers((prev) => prev.map((row) => (row.id === user.id ? { ...row, status: nextStatus } : row)));
    try {
      await postToAnyAdminUsersEndpoint(
        ["/api/v1/admin/users/status-change", "/admin/users/status-change"],
        {
          user_id: user.id,
          status: nextStatus === "blocked" ? "block" : "active",
        },
      );
      showSuccess("User status updated.");
    } catch {
      setUsers((prev) => prev.map((row) => (row.id === user.id ? { ...row, status: previousStatus } : row)));
      setError("Failed to update user status.");
      showError("Failed to update user status.");
    } finally {
      setActionUserId(null);
      setActionType(null);
    }
  };

  const handleDelete = (user: UserRow) => {
    setDeleteTarget(user);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setActionUserId(deleteTarget.id);
    setActionType("delete");
    try {
      await postToAnyAdminUsersEndpoint(["/api/v1/admin/users/delete", "/admin/users/delete"], {
        user_id: deleteTarget.id,
      });
      setDeleteTarget(null);
      await fetchUsers({ silent: true });
      void fetchSummary();
      alert.crud.deleted("User");
    } catch {
      setError("Failed to delete user.");
      showError("Failed to delete user.");
    } finally {
      setActionUserId(null);
      setActionType(null);
    }
  };

  const handleViewWallet = (user: UserRow) => {
    navigate(`/admin/user-management/user/${user.id}/wallet`, {
      state: {
        userName: user.name,
        userEmail: user.email,
      },
    });
  };

  return (
    <div>
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-chat-accent">User Management</p>
        <p className="text-sm text-body-secondary">Oversee and moderate the Gidira ecosystem participants.</p>
      </div>

      <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-xl border border-chat-border-subtle bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">All Users</p>
              <p className="mt-1 text-4xl font-semibold leading-10 text-ink">{allUsers.toLocaleString()}</p>
              <p className="mt-1 text-xs font-medium text-success">Overall</p>
            </div>
            <span className="rounded-lg bg-success/10 p-2 text-success">
              <UsersRound className="size-4" />
            </span>
          </div>
        </article>
        <article className="rounded-xl border border-chat-border-subtle bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Total Users</p>
              <p className="mt-1 text-4xl font-semibold leading-10 text-ink">{totalUsers.toLocaleString()}</p>
              <p className="mt-1 text-xs font-medium text-success">+8%</p>
            </div>
            <span className="rounded-lg bg-success/10 p-2 text-success">
              <UsersRound className="size-4" />
            </span>
          </div>
        </article>
        <article className="rounded-xl border border-chat-border-subtle bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Total Vendors</p>
              <p className="mt-1 text-4xl font-semibold leading-10 text-ink">{totalVendors.toLocaleString()}</p>
              <p className="mt-1 text-xs font-medium text-chat-accent">Updated</p>
            </div>
            <span className="rounded-lg bg-surface-soft p-2 text-chat-accent">
              <BriefcaseBusiness className="size-4" />
            </span>
          </div>
        </article>
        <article className="rounded-xl border border-chat-border-subtle bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">Total Admins</p>
              <p className="mt-1 text-4xl font-semibold leading-10 text-ink">{totalAdmins.toLocaleString()}</p>
              <p className="mt-1 text-xs font-medium text-brand-red">Internal</p>
            </div>
            <span className="rounded-lg bg-tint-red p-2 text-brand-red">
              <ShieldUser className="size-4" />
            </span>
          </div>
        </article>
        <article className="rounded-xl border border-chat-border-subtle bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-chat-meta">New Signups</p>
              <p className="mt-1 text-4xl font-semibold leading-10 text-ink">{newSignups.toLocaleString()}</p>
              <p className="mt-1 text-xs font-medium text-amber-600">Steady</p>
            </div>
            <span className="rounded-lg bg-amber-100 p-2 text-amber-600">
              <UserPlus className="size-4" />
            </span>
          </div>
        </article>
      </section>

      <div className="mb-4">
        <h1 className="text-2xl font-semibold leading-tight text-ink-heading sm:text-3xl">Users</h1>
      </div>

      <section className="rounded-2xl border border-border-gray bg-card p-3 shadow-sm sm:p-4 lg:p-6">
        {error ? (
          <div className="mb-4 rounded-lg border border-tint-red/40 bg-tint-red/10 px-3 py-2 text-sm text-brand-red">
            {error}
          </div>
        ) : null}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <label className="relative min-w-0 w-full flex-1 sm:max-w-[971px] sm:min-w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-chat-meta" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-10 w-full rounded-xl border border-border-gray bg-card pl-10 pr-4 text-base text-ink placeholder:text-ink/50 focus:outline-none"
            />
          </label>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={() => void exportToExcel()}
              disabled={exporting}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-chat-accent/30 bg-surface-soft px-4 text-sm font-medium text-chat-accent hover:bg-surface-soft/70 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              {exporting ? "Exporting…" : "Export all (CSV)"}
            </button>
            <div className="relative w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setIsRoleMenuOpen((prev) => !prev);
                  setIsStatusMenuOpen(false);
                }}
                className="inline-flex h-10 w-full min-w-0 items-center justify-between rounded-xl border border-border-gray bg-card px-4 text-sm text-body-secondary sm:min-w-44"
              >
                <span className="capitalize">{roleLabel}</span>
                <ChevronDown className="size-4" />
              </button>
              {isRoleMenuOpen ? (
                <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-border-gray bg-card shadow-sm">
                  {(["all", "user", "vendor", "admin"] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setRoleFilter(role);
                        setPage(1);
                        setIsRoleMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm capitalize text-ink hover:bg-muted"
                    >
                      <span>{role === "all" ? "Select Role" : role}</span>
                      {roleFilter === role ? <span className="text-xs text-chat-accent">Selected</span> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="relative w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setIsStatusMenuOpen((prev) => !prev);
                  setIsRoleMenuOpen(false);
                }}
                className="inline-flex h-10 w-full min-w-0 items-center justify-between rounded-xl border border-border-gray bg-card px-4 text-sm text-body-secondary sm:min-w-48"
              >
                <span className="capitalize">{statusLabel}</span>
                <ChevronDown className="size-4" />
              </button>
              {isStatusMenuOpen ? (
                <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-border-gray bg-card shadow-sm">
                  {(["all", "active", "blocked", "pending"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setStatusFilter(status);
                        setPage(1);
                        setIsStatusMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm capitalize text-ink hover:bg-muted"
                    >
                      <span>{status === "all" ? "Select Status" : status}</span>
                      {statusFilter === status ? <span className="text-xs text-chat-accent">Selected</span> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="border-b border-border-gray">
                <th className="px-2 py-2 text-left text-xs font-semibold text-body-secondary sm:px-4 sm:py-3 sm:text-sm">
                  SN
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-body-secondary sm:px-4 sm:py-3 sm:text-sm">
                  Name
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-body-secondary sm:px-4 sm:py-3 sm:text-sm">
                  Phone / Email
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-body-secondary sm:px-4 sm:py-3 sm:text-sm">
                  Role
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-body-secondary sm:px-4 sm:py-3 sm:text-sm">
                  Status
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-body-secondary sm:px-4 sm:py-3 sm:text-sm">
                  Join Date
                </th>
                <th className="px-2 py-2 text-right text-xs font-semibold text-body-secondary sm:px-4 sm:py-3 sm:text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-2 py-8 text-center text-sm text-chat-meta sm:px-4">
                    Loading users...
                  </td>
                </tr>
              ) : null}
              {!isLoading
                ? users.map((user, index) => {
                    const sn = (pagination.current_page - 1) * pagination.per_page + index + 1;
                    return (
                      <tr key={`${user.id}-${user.email}`} className="border-b border-border-light">
                        <td className="px-2 py-3 text-sm text-body-secondary sm:px-4 sm:py-5">{sn}</td>
                        <td className="px-2 py-3 text-sm font-medium text-ink sm:px-4 sm:py-5 sm:text-base" title={user.name}>
                          {limitText(user.name, 22)}
                        </td>
                        <td className="px-2 py-3 sm:px-4 sm:py-4">
                          <p className="text-xs leading-5 text-ink sm:text-sm" title={user.phone}>
                            {limitText(user.phone, 18)}
                          </p>
                          <p className="text-xs leading-5 text-chat-meta sm:text-sm" title={user.email}>
                            {limitText(user.email, 28)}
                          </p>
                        </td>
                        <td className="px-2 py-3 sm:px-4 sm:py-4">
                          <span
                            className={`inline-flex min-w-[70px] justify-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${roleClass(user.role)}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-2 py-3 sm:px-4 sm:py-4">
                          <span
                            className={`inline-flex min-w-[76px] justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(user.status)}`}
                          >
                            {user.status === "active" ? "Active" : user.status === "pending" ? "Pending" : "Blocked"}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-xs text-body-secondary sm:px-4 sm:py-4 sm:text-sm">{user.joinDate}</td>
                        <td className="px-2 py-3 sm:px-4 sm:py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              className="inline-flex h-7 w-10 items-center justify-center rounded-xl hover:bg-muted"
                              onClick={() => handleViewWallet(user)}
                              title="View wallet"
                              aria-label={`View wallet for ${user.name}`}
                            >
                              <Wallet className="size-4 text-body-secondary" />
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-7 w-10 items-center justify-center rounded-xl hover:bg-muted"
                              onClick={() => void handleView(user)}
                              disabled={actionUserId === user.id}
                            >
                              {actionUserId === user.id && actionType === "view" ? (
                                <Loader2 className="size-4 animate-spin text-body-secondary" />
                              ) : (
                                <Eye className="size-4 text-body-secondary" />
                              )}
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-7 w-10 items-center justify-center rounded-xl hover:bg-muted"
                              onClick={() => void handleStatusChange(user)}
                              disabled={actionUserId === user.id}
                              title={user.status === "active" ? "Block user" : "Activate user"}
                            >
                              {actionUserId === user.id && actionType === "status" ? (
                                <Loader2 className="size-4 animate-spin text-amber-500" />
                              ) : (
                                <Ban className="size-4 text-amber-500" />
                              )}
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-7 w-10 items-center justify-center rounded-xl hover:bg-muted"
                              onClick={() => void handleDelete(user)}
                              disabled={actionUserId === user.id}
                            >
                              {actionUserId === user.id && actionType === "delete" ? (
                                <Loader2 className="size-4 animate-spin text-brand-red" />
                              ) : (
                                <Trash2 className="size-4 text-brand-red" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                : null}
              {!isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-8 text-center text-sm text-chat-meta sm:px-4">
                    No users found for the current search/filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-tint-red/20 px-1 pb-0 pt-4">
          <p className="text-xs font-medium text-body-secondary">
            Showing {rangeFrom}-{rangeTo} of {pagination.total} users
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.current_page <= 1 || isLoading}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-gray text-body-secondary hover:bg-muted disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </button>
            {pageNumbers.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                disabled={isLoading}
                className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors ${
                  pagination.current_page === p
                    ? "bg-ink text-white"
                    : "border border-border-gray text-body-secondary hover:bg-muted"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={pagination.current_page >= lastPage || isLoading}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-gray text-body-secondary hover:bg-muted disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </section>

      <UserDetailsModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setDetailsLoading(false);
        }}
        user={selectedUser}
        loading={detailsLoading}
      />

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
          onClick={() => setDeleteTarget(null)}
          role="presentation"
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-user-title"
            aria-describedby="delete-user-desc"
          >
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-body-secondary hover:bg-muted"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex size-10 items-center justify-center rounded-full bg-tint-red text-brand-red">
                <CircleAlert className="size-5" />
              </span>
              <div className="min-w-0 space-y-1">
                <h2 id="delete-user-title" className="text-lg font-semibold text-ink">
                  Confirm Delete
                </h2>
                <p id="delete-user-desc" className="text-sm text-body-secondary">
                  Delete user <span className="font-semibold text-ink">{deleteTarget.name}</span>? This action cannot
                  be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-border-gray px-4 py-2 text-sm font-medium text-body-secondary hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmDelete()}
                disabled={actionType === "delete"}
                className="inline-flex min-w-[110px] items-center justify-center rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-ice hover:bg-brand-red/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionType === "delete" ? <Loader2 className="size-4 animate-spin" /> : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
