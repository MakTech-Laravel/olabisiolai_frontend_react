import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  adminCreateCategory,
  adminDeleteCategory,
  adminListCategories,
  adminUpdateCategory,
} from "@/features/categories/adminCategoriesApi";
import type { CategoryDto } from "@/features/categories/types";
import { alert, showError } from "@/lib/sweetAlert";

const PER_PAGE = 10;

export default function CategoriesTable() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSubcategories, setEditSubcategories] = useState("");
  const [editIconFile, setEditIconFile] = useState<File | null>(null);
  const [editIconPreview, setEditIconPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const listQuery = useQuery({
    queryKey: ["admin", "categories", page, debouncedSearch, PER_PAGE],
    queryFn: () =>
      adminListCategories({
        search: debouncedSearch || undefined,
        page,
        per_page: PER_PAGE,
      }),
  });

  const categories = listQuery.data?.categories ?? [];
  const pagination = listQuery.data?.pagination;
  const lastPage = pagination?.last_page ?? 1;

  const createMut = useMutation({
    mutationFn: () => {
      if (!editIconFile) throw new Error("Icon is required.");
      return adminCreateCategory({
        name: editName,
        subcategories: editSubcategories.split(",").map((s) => s.trim()).filter(Boolean),
        icon: editIconFile,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      closeModal();
      alert.crud.created("Category");
    },
    onError: (e: unknown) => setFormError(messageFromUnknown(e)),
  });

  const updateMut = useMutation({
    mutationFn: () => {
      if (!editingCategory) throw new Error("No category");
      return adminUpdateCategory({
        id: editingCategory.id,
        name: editName,
        subcategories: editSubcategories.split(",").map((s) => s.trim()).filter(Boolean),
        icon: editIconFile,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      closeModal();
      alert.crud.updated("Category");
    },
    onError: (e: unknown) => setFormError(messageFromUnknown(e)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => adminDeleteCategory(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      alert.crud.deleted("Category");
    },
    onError: (e: unknown) => {
      showError(messageFromUnknown(e));
    },
  });

  useEffect(() => {
    if (!showEditModal) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [showEditModal]);

  const closeModal = () => {
    setShowEditModal(false);
    setEditingCategory(null);
    setIsAdding(false);
    setEditIconFile(null);
    setEditIconPreview(null);
    setFormError(null);
  };

  const handleDelete = async (id: number, name: string) => {
    const confirmed = await alert.confirmDelete(name);
    if (!confirmed) return;
    deleteMut.mutate(id);
  };

  const handleEdit = (category: CategoryDto) => {
    setIsAdding(false);
    setEditingCategory(category);
    setEditName(category.name);
    setEditSubcategories(category.subcategories.join(", "));
    setEditIconFile(null);
    setEditIconPreview(category.icon_url ?? null);
    setFormError(null);
    setShowEditModal(true);
  };

  const handleIconChange = (file: File | null) => {
    if (!file) {
      setEditIconFile(null);
      setEditIconPreview(editingCategory?.icon_url ?? null);
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["png", "svg"].includes(ext)) {
      setFormError("Icon must be a PNG or SVG file.");
      return;
    }

    setFormError(null);
    setEditIconFile(file);
    setEditIconPreview(URL.createObjectURL(file));
  };

  const handleSave = () => {
    setFormError(null);
    const name = editName.trim();
    if (!name) {
      setFormError("Name is required.");
      return;
    }
    if (isAdding && !editIconFile) {
      setFormError("Icon is required (PNG or SVG).");
      return;
    }
    if (isAdding) createMut.mutate();
    else updateMut.mutate();
  };

  const openAdd = () => {
    setIsAdding(true);
    setEditingCategory(null);
    setEditName("");
    setEditSubcategories("");
    setEditIconFile(null);
    setEditIconPreview(null);
    setFormError(null);
    setShowEditModal(true);
  };

  const EditIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );

  const SubcategoryBadges = ({ subcategories }: { subcategories: string[] }) => (
    <div className="flex flex-wrap gap-1.5">
      {subcategories.map((sub) => (
        <span
          key={sub}
          className="inline-flex items-center rounded-md border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs text-gray-600 font-medium"
        >
          {sub}
        </span>
      ))}
    </div>
  );

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 font-sans">
      <h1 className="text-2xl font-bold text-gray-800">Categories</h1>

      <div className="mb-4 mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search categories…"
          className="w-full max-w-md rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 sm:px-5 text-sm font-medium text-white shadow-sm hover:bg-blue-600 active:scale-95 transition-all"
        >
          <Plus className="size-4" />
          Add Category
        </button>
      </div>

      {listQuery.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Failed to load categories. Are you signed in as an admin?
        </div>
      ) : null}

      <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
        {listQuery.isFetching ? (
          <>
            <Loader2 className="size-4 animate-spin text-blue-500" aria-hidden />
            <span>Updating…</span>
          </>
        ) : pagination ? (
          <span>
            Page {pagination.current_page} of {lastPage} · {pagination.total} total
          </span>
        ) : null}
      </div>

      {/* ── Desktop table (md and up) ── */}
      <div className="hidden md:block rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wide w-20">
                  SN
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wide w-64">
                  Category Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wide w-20">
                  Icon
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-900 uppercase tracking-wide w-28">
                  Businesses
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wide">
                  Subcategories
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-900 uppercase tracking-wide w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat, index) => (
                <tr key={cat.id} className="group hover:bg-gray-50/70 transition-colors">
                  <td className="px-6 py-4 align-top pt-5 text-sm text-gray-500">
                    {(pagination?.current_page ? (pagination.current_page - 1) * PER_PAGE : 0) + index + 1}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-800 whitespace-nowrap align-top pt-5">
                    {cat.name}
                  </td>
                  <td className="px-6 py-4 align-top pt-5">
                    {cat.icon_url ? (
                      <img src={cat.icon_url} alt="" className="size-8 object-contain" />
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 align-top pt-5 text-center">
                    <span className="inline-flex min-w-8 items-center justify-center rounded-md bg-gray-100 px-2.5 py-1 text-sm font-semibold tabular-nums text-gray-800">
                      {cat.business_count ?? 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-top pt-5">
                    <SubcategoryBadges subcategories={cat.subcategories} />
                  </td>
                  <td className="px-6 py-4 align-top pt-5">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(cat)}
                        className="text-gray-900 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-blue-50"
                        aria-label={`Edit ${cat.name}`}
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat.id, cat.name)}
                        disabled={deleteMut.isPending}
                        className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50 disabled:opacity-50"
                        aria-label={`Delete ${cat.name}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!listQuery.isLoading && categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                    No categories found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile cards (below md) ── */}
      <div className="md:hidden space-y-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                {cat.icon_url ? (
                  <img src={cat.icon_url} alt="" className="size-8 shrink-0 object-contain" />
                ) : null}
                <p className="font-semibold text-gray-800 text-sm leading-tight">{cat.name}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleEdit(cat)}
                  className="text-gray-600 hover:text-blue-600 transition-colors p-1.5 rounded-md hover:bg-blue-50"
                  aria-label={`Edit ${cat.name}`}
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(cat.id, cat.name)}
                  disabled={deleteMut.isPending}
                  className="text-red-400 hover:text-red-600 transition-colors p-1.5 rounded-md hover:bg-red-50 disabled:opacity-50"
                  aria-label={`Delete ${cat.name}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 mb-3" />

            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Businesses</p>
              <span className="inline-flex min-w-8 items-center justify-center rounded-md bg-gray-100 px-2.5 py-1 text-sm font-semibold tabular-nums text-gray-800">
                {cat.business_count ?? 0}
              </span>
            </div>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Subcategories
            </p>
            <SubcategoryBadges subcategories={cat.subcategories} />
          </div>
        ))}
      </div>

      {pagination && pagination.total > PER_PAGE ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || listQuery.isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            {page} / {lastPage}
          </span>
          <button
            type="button"
            disabled={page >= lastPage || listQuery.isFetching}
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}

      {/* ── Edit Modal ── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overscroll-contain bg-black/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl max-h-[92dvh]">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-5">
              <h3 className="text-base font-semibold text-gray-900">{isAdding ? "Add Category" : "Edit Category"}</h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="max-h-[calc(92dvh-132px)] overflow-y-auto px-4 py-4 space-y-4 sm:px-5">
              {formError ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</p>
              ) : null}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Icon
                  <span className="ml-1 font-normal text-gray-400">
                    ({isAdding ? "PNG or SVG required" : "PNG or SVG, optional"})
                  </span>
                </label>
                {editIconPreview ? (
                  <div className="mb-2 flex items-center gap-3">
                    <img src={editIconPreview} alt="" className="size-12 object-contain rounded border border-gray-200 bg-gray-50 p-1" />
                    {!isAdding && !editIconFile ? (
                      <span className="text-xs text-gray-500">Current icon</span>
                    ) : null}
                  </div>
                ) : null}
                <input
                  type="file"
                  accept=".png,.svg,image/png,image/svg+xml"
                  onChange={(e) => handleIconChange(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Subcategories
                  <span className="ml-1 font-normal text-gray-400">(comma separated)</span>
                </label>
                <input
                  type="text"
                  value={editSubcategories}
                  onChange={(e) => setEditSubcategories(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="sticky bottom-0 flex gap-3 border-t border-gray-100 bg-white px-4 pb-4 pt-3 sm:justify-end sm:px-5 sm:pb-5 sm:pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 sm:flex-none sm:py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 sm:flex-none sm:py-2 disabled:opacity-60"
              >
                {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                {isAdding ? "Add" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function messageFromUnknown(e: unknown): string {
  if (e && typeof e === "object" && "response" in e) {
    const res = (e as { response?: { data?: { message?: string } } }).response;
    const msg = res?.data?.message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  if (e instanceof Error && e.message) return e.message;
  return "Request failed.";
}
