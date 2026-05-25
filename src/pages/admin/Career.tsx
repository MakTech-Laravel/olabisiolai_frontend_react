import { useState } from "react";
import { alert } from "@/lib/sweetAlert";
import { ChevronLeft, ChevronRight, MapPin, Briefcase } from "lucide-react";
import { router } from "@/routes/router";

type JobType = "Full-Time" | "Part-Time" | "Contract" | "Remote";

type Designation = {
  id: number;
  title: string;
  category: string;
  location: string;
  salary: string;
  description: string;
  type: JobType;
};

const DATA: Designation[] = [

  { id: 2, title: "Customer Support Specialist", category: "Professional Services", location: "Lagos, Nigeria", salary: "$20,000 - $30,000", description: "Lagos, Nigeria (Hybrid).", type: "Part-Time" },
  { id: 3, title: "Customer Support Specialist", category: "Professional Services", location: "Lagos, Nigeria", salary: "$20,000 - $30,000", description: "Lagos, Nigeria (Hybrid).", type: "Part-Time" },
  { id: 4, title: "Customer Support Specialist", category: "Professional Services", location: "Lagos, Nigeria", salary: "$30,000 - $40,000", description: "Lagos, Nigeria (Hybrid).", type: "Full-Time" },
  { id: 5, title: "Product Designer", category: "Technology", location: "Abuja, Nigeria", salary: "$50,000 - $70,000", description: "Lagos, Nigeria (Hybrid).", type: "Remote" },
  { id: 6, title: "Backend Engineer", category: "Technology", location: "Lagos, Nigeria", salary: "$60,000 - $80,000", description: "Lagos, Nigeria (Hybrid).", type: "Contract" },
];

const TOTAL = 482;
const PER_PAGE = 10;
const TOTAL_PAGES = Math.ceil(TOTAL / PER_PAGE);

const TYPE_STYLES: Record<JobType, { pill: string; dot: string }> = {
  "Full-Time": { pill: "bg-teal-50 text-teal-700 border border-teal-100", dot: "bg-teal-400" },
  "Part-Time": { pill: "bg-amber-50 text-amber-700 border border-amber-100", dot: "bg-amber-400" },
  "Contract": { pill: "bg-violet-50 text-violet-700 border border-violet-100", dot: "bg-violet-400" },
  "Remote": { pill: "bg-sky-50 text-sky-700 border border-sky-100", dot: "bg-sky-400" },
};

function TypeBadge({ type }: { type: JobType }) {
  const s = TYPE_STYLES[type];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${s.pill}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {type}
    </span>
  );
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export default function DesignationsTable() {
  const [rows, setRows] = useState<Designation[]>(DATA);
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const handleDelete = async (id: number, title: string) => {
    const confirmed = await alert.confirmDelete(title);
    if (!confirmed) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
    alert.crud.deleted("Job posting");
  };

  const pageNumbers = [1, 2, 3];

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-8 font-sans">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Career</h1>
          {/* <p className="text-sm text-slate-400 mt-0.5">{TOTAL} posts total</p> */}
        </div>
        <button
          onClick={() => router.navigate("/admin/career/add")}
          className="group inline-flex hover:cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all duration-150"
        >
          <span className="flex size-4 items-center justify-center rounded-full bg-white/20 text-white font-bold leading-none text-base">+</span>
          Add Post
        </button>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-100">

        {/* ── Desktop table ── */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-700">
                  Designation Name
                </th>
                <th className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-700">
                  Location
                </th>
                <th className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest text-slate-700">
                  Type
                </th>
                <th className="px-6 py-3.5 text-right text-[11px] font-bold uppercase tracking-widest text-slate-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  onMouseEnter={() => setHoveredRow(row.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`border-b border-slate-100 last:border-0 transition-colors duration-100 ${hoveredRow === row.id ? "bg-blue-50/40" : "bg-white"
                    }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">

                      <span className="font-semibold text-slate-800">{row.title}</span>
                    </div>
                  </td>


                  <td className="px-6 py-4">
                    <span className="text-slate-500">{row.description}</span>
                  </td>
                  <td className="px-6 py-4">
                    <TypeBadge type={row.type} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => router.navigate(`/admin/career/edit/${row.id}`, { state: { designation: row } })}
                        className="rounded-lg hover:cursor-pointer p-2 text-slate-700 transition-all hover:bg-blue-50 hover:text-blue-600 active:scale-95"
                        aria-label={`Edit ${row.title}`}
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => void handleDelete(row.id, row.title)}
                        className="rounded-lg hover:cursor-pointer p-2 hover:text-slate-400 transition-all hover:bg-red-50 text-red-500 active:scale-95"
                        aria-label={`Delete ${row.title}`}
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Mobile cards ── */}
        <div className="sm:hidden divide-y divide-slate-100">
          {rows.map((row) => (
            <div key={row.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <Briefcase className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{row.title}</p>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400">
                      <MapPin className="size-3 shrink-0" />
                      <span>{row.location}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      {row.category}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      {row.salary}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      {row.description}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => router.navigate(`/admin/career/edit/${row.id}`, { state: { designation: row } })} className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 active:scale-95 transition-all">
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => void handleDelete(row.id, row.title)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 active:scale-95 transition-all"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>
              <div className="mt-3 pl-12">
                <TypeBadge type={row.type} />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/40 px-6 py-3.5">
          <p className="text-xs text-slate-600 font-medium">
            Showing 1–{Math.min(PER_PAGE, TOTAL)} of{" "}
            <span className="text-slate-600 font-semibold">{TOTAL}</span> transactions
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </button>

            {pageNumbers.map((n) => (
              <button
                key={n}
                onClick={() => setCurrentPage(n)}
                className={`flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition-all ${currentPage === n
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                  : "text-slate-500 hover:bg-slate-100"
                  }`}
              >
                {n}
              </button>
            ))}

            <span className="flex size-8 items-center justify-center text-xs text-slate-400 select-none">
              ···
            </span>

            <button
              onClick={() => setCurrentPage(TOTAL_PAGES)}
              className={`flex size-8 items-center justify-center rounded-lg text-xs font-semibold transition-all ${currentPage === TOTAL_PAGES
                ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                : "text-slate-500 hover:bg-slate-100"
                }`}
            >
              {TOTAL_PAGES}
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.min(TOTAL_PAGES, p + 1))}
              disabled={currentPage === TOTAL_PAGES}
              className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}