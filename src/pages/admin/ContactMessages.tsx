import {

  ChevronLeft,

  ChevronRight,

  Eye,

  Loader2,

  Mail,

  Search,

  Trash2,

} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";



import { ContactMessageDetailsModal } from "@/components/Modal/ContactMessageDetailsModal";

import {

  adminDeleteContactMessage,

  adminListContactMessages,

  adminUpdateContactMessage,

  adminViewContactMessage,

  type ContactMessageStatusCounts,

} from "@/features/contact/adminContactApi";

import type {

  ContactMessageDto,

  ContactMessageStatus,

} from "@/features/contact/types";

import { alert, showError, showSuccess } from "@/lib/sweetAlert";

import { cn } from "@/lib/utils";



const STATUS_TABS = [

  { key: "", label: "All", countKey: "all" as const },

  { key: "new", label: "New", countKey: "new" as const },

  { key: "read", label: "Read", countKey: "read" as const },

  { key: "archived", label: "Archived", countKey: "archived" as const },

] as const;



type StatusFilter = (typeof STATUS_TABS)[number]["key"];



const EMPTY_COUNTS: ContactMessageStatusCounts = {

  all: 0,

  new: 0,

  read: 0,

  archived: 0,

};



const STATUS_STYLES: Record<ContactMessageStatus, string> = {

  new: "bg-blue-50 text-blue-700 border border-blue-100",

  read: "bg-slate-100 text-slate-700 border border-slate-200",

  archived: "bg-amber-50 text-amber-700 border border-amber-100",

};



function StatusBadge({ status }: { status: ContactMessageDto["status"] }) {

  const normalized = status === "replied" ? "read" : status;

  const label = status === "replied" ? "read" : status;

  return (

    <span

      className={cn(

        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",

        STATUS_STYLES[normalized as ContactMessageStatus] ?? STATUS_STYLES.read,

      )}

    >

      {label}

    </span>

  );

}



function emptyStateLabel(filter: StatusFilter, search: string): string {

  if (search.trim()) return "No messages match your search.";

  if (filter === "") return "No contact messages yet.";

  return `No ${filter} messages yet.`;

}



export default function ContactMessages() {

  const [rows, setRows] = useState<ContactMessageDto[]>([]);

  const [counts, setCounts] = useState<ContactMessageStatusCounts>(EMPTY_COUNTS);

  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);

  const [lastPage, setLastPage] = useState(1);

  const [total, setTotal] = useState(0);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");

  const [search, setSearch] = useState("");

  const [searchInput, setSearchInput] = useState("");



  const [selected, setSelected] = useState<ContactMessageDto | null>(null);

  const [modalOpen, setModalOpen] = useState(false);

  const [modalLoading, setModalLoading] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);



  const activeTab = useMemo(

    () => STATUS_TABS.find((tab) => tab.key === statusFilter) ?? STATUS_TABS[0],

    [statusFilter],

  );



  const load = useCallback(async () => {

    setLoading(true);

    try {

      const result = await adminListContactMessages({

        page,

        per_page: 15,

        status: statusFilter || undefined,

        search: search.trim() || undefined,

      });

      setRows(result.data);

      setLastPage(result.pagination.last_page);

      setTotal(result.pagination.total);

      setCounts(result.counts);

    } catch {

      setRows([]);

      setCounts(EMPTY_COUNTS);

      showError("Could not load contact messages.");

    } finally {

      setLoading(false);

    }

  }, [page, search, statusFilter]);



  useEffect(() => {

    void load();

  }, [load]);



  const handleSearchSubmit = (e: React.FormEvent) => {

    e.preventDefault();

    setSearch(searchInput);

    setPage(1);

  };



  const handleTabChange = (key: StatusFilter) => {

    setStatusFilter(key);

    setPage(1);

  };



  const openMessage = async (row: ContactMessageDto) => {

    setModalOpen(true);

    setModalLoading(true);

    setSelected(row);

    try {

      const full = await adminViewContactMessage(row.id);

      setSelected(full);

      if (statusFilter === "new" && full.status !== "new") {

        void load();

      } else {

        setRows((prev) =>

          prev.map((item) => (item.id === full.id ? { ...item, ...full } : item)),

        );

        void load();

      }

    } catch {

      showError("Could not load message details.");

      setModalOpen(false);

    } finally {

      setModalLoading(false);

    }

  };



  const handleDelete = async (row: ContactMessageDto) => {
    const isPermanentDelete = row.status === "archived";

    const confirmed = isPermanentDelete
      ? await alert.confirmDelete(
        row.subject,
        "This will permanently remove the message from the system.",
      )
      : await alert.confirm({
        title: "Archive message?",
        html: `<p>Move <strong>${row.subject}</strong> to <strong>Archived</strong>? You can permanently delete it from the Archived tab later.</p>`,
        icon: "question",
        confirmText: "Yes, archive",
        confirmButtonColor: "#0B1C30",
      });

    if (!confirmed) return;

    setDeletingId(row.id);
    try {
      if (isPermanentDelete) {
        await adminDeleteContactMessage(row.id);
        showSuccess("Contact message permanently deleted.");
      } else {
        await adminUpdateContactMessage(row.id, { status: "archived" });
        showSuccess("Contact message moved to Archived.");
      }

      if (rows.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        void load();
      }
    } catch {
      showError(
        isPermanentDelete
          ? "Could not permanently delete this message."
          : "Could not archive this message.",
      );
    } finally {
      setDeletingId(null);
    }
  };



  const handleMessageUpdated = (updated: ContactMessageDto) => {

    void load();

    if (!statusFilter || updated.status === statusFilter) {

      setRows((prev) =>

        prev.map((item) => (item.id === updated.id ? updated : item)),

      );

    }

  };



  return (

    <div className="min-h-screen bg-slate-50/70 p-4 font-sans sm:p-8">

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h1 className="text-xl font-bold tracking-tight text-slate-800">

            Contact Us

          </h1>

          <p className="mt-0.5 text-sm text-slate-500">

            {counts.all} total submission{counts.all === 1 ? "" : "s"}

            {statusFilter !== "" ? (

              <>

                {" "}

                · showing {total} {activeTab.label.toLowerCase()}

              </>

            ) : search.trim() ? (

              <> · {total} matching search</>

            ) : null}

          </p>

        </div>

        <form onSubmit={handleSearchSubmit} className="flex w-full max-w-md gap-2">

          <div className="relative flex-1">

            <Search

              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"

              aria-hidden

            />

            <input

              type="search"

              value={searchInput}

              onChange={(e) => setSearchInput(e.target.value)}

              placeholder="Search name, email, subject…"

              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400"

            />

          </div>

          <button

            type="submit"

            className="rounded-xl bg-brand px-4 text-sm font-medium text-ice hover:opacity-90"

          >

            Search

          </button>

        </form>

      </div>



      <div

        className="mb-4 flex flex-wrap gap-2"

        role="tablist"

        aria-label="Filter contact messages by status"

      >

        {STATUS_TABS.map((tab) => {

          const isActive = statusFilter === tab.key;

          const tabCount = counts[tab.countKey];



          return (

            <button

              key={tab.key || "all"}

              type="button"

              role="tab"

              aria-selected={isActive}

              onClick={() => handleTabChange(tab.key)}

              className={cn(

                "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",

                isActive

                  ? "bg-brand text-ice shadow-sm"

                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",

              )}

            >

              {tab.label}

              <span

                className={cn(

                  "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",

                  isActive ? "bg-white/20 text-ice" : "bg-slate-100 text-slate-600",

                )}

              >

                {tabCount}

              </span>

            </button>

          );

        })}

      </div>



      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">

        {loading ? (

          <div className="flex justify-center py-16">

            <Loader2 className="size-8 animate-spin text-brand" aria-hidden />

          </div>

        ) : rows.length === 0 ? (

          <div className="flex flex-col items-center gap-2 py-16 text-slate-500">

            <Mail className="size-10 text-slate-300" aria-hidden />

            <p className="text-sm">{emptyStateLabel(statusFilter, search)}</p>

            {statusFilter !== "" || search.trim() ? (

              <button

                type="button"

                onClick={() => {

                  setStatusFilter("");

                  setSearch("");

                  setSearchInput("");

                  setPage(1);

                }}

                className="mt-2 text-sm font-medium text-brand hover:underline"

              >

                View all messages

              </button>

            ) : null}

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>

                <tr className="border-b border-slate-100 bg-slate-50/60">

                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-700">

                    From

                  </th>

                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-700">

                    Subject

                  </th>

                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-700">

                    Status

                  </th>

                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-700">

                    Received

                  </th>

                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-slate-700">

                    Actions

                  </th>

                </tr>

              </thead>

              <tbody>

                {rows.map((row) => (

                  <tr

                    key={row.id}

                    className="border-b border-slate-50 transition-colors hover:bg-slate-50/50"

                  >

                    <td className="px-4 py-3">

                      <p className="font-medium text-slate-800">{row.full_name}</p>

                      <p className="text-xs text-slate-500">{row.email}</p>

                    </td>

                    <td className="max-w-xs truncate px-4 py-3 text-slate-700">

                      {row.subject}

                    </td>

                    <td className="px-4 py-3">

                      <StatusBadge status={row.status} />

                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">

                      {row.created_at}

                    </td>

                    <td className="px-4 py-3">

                      <div className="flex items-center justify-end gap-2">

                        <button

                          type="button"

                          onClick={() => void openMessage(row)}

                          className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-brand"

                          aria-label="View message"

                        >

                          <Eye className="size-4" />

                        </button>

                        <button

                          type="button"

                          disabled={deletingId === row.id}

                          onClick={() => void handleDelete(row)}

                          className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"

                          aria-label={
                            row.status === "archived"
                              ? "Permanently delete message"
                              : "Archive message"
                          }
                          title={
                            row.status === "archived"
                              ? "Permanently delete"
                              : "Move to Archived"
                          }

                        >

                          {deletingId === row.id ? (

                            <Loader2 className="size-4 animate-spin" />

                          ) : (

                            <Trash2 className="size-4" />

                          )}

                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}



        {lastPage > 1 ? (

          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">

            <p className="text-xs text-slate-500">

              Page {page} of {lastPage}

            </p>

            <div className="flex gap-1">

              <button

                type="button"

                disabled={page <= 1}

                onClick={() => setPage((p) => Math.max(1, p - 1))}

                className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40"

                aria-label="Previous page"

              >

                <ChevronLeft className="size-4" />

              </button>

              <button

                type="button"

                disabled={page >= lastPage}

                onClick={() => setPage((p) => p + 1)}

                className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40"

                aria-label="Next page"

              >

                <ChevronRight className="size-4" />

              </button>

            </div>

          </div>

        ) : null}

      </div>



      <ContactMessageDetailsModal

        open={modalOpen}

        message={selected}

        loading={modalLoading}

        onClose={() => {

          setModalOpen(false);

          setSelected(null);

        }}

        onUpdated={handleMessageUpdated}

      />

    </div>

  );

}


