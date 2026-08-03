import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Pencil, RefreshCw, Search, X } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  adminGenerateSitemap,
  adminListSeoPages,
  adminUpdateSeoPage,
} from "@/features/seo/adminSeoApi"
import type { SeoPageDto } from "@/features/seo/types"
import { alert, showError } from "@/lib/sweetAlert"
import { cn } from "@/lib/utils"

function messageFromUnknown(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message: unknown }).message
    if (typeof msg === "string" && msg.trim()) return msg
  }
  return "Something went wrong. Please try again."
}

export default function SeoPages() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<SeoPageDto | null>(null)
  const [metaTitle, setMetaTitle] = useState("")
  const [metaDescription, setMetaDescription] = useState("")
  const [metaKeywords, setMetaKeywords] = useState("")

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const listQuery = useQuery({
    queryKey: ["admin", "seo-pages", debouncedSearch, page],
    queryFn: () =>
      adminListSeoPages({
        search: debouncedSearch || undefined,
        page,
        perPage: 20,
      }),
  })

  const saveMut = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error("No page selected")
      return adminUpdateSeoPage({
        id: editing.id,
        metaTitle,
        metaDescription,
        metaKeywords,
      })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "seo-pages"] })
      void qc.invalidateQueries({ queryKey: ["public", "seo"] })
      setEditing(null)
      void alert.success("SEO page updated successfully.")
    },
    onError: (e: unknown) => showError(messageFromUnknown(e)),
  })

  const generateMut = useMutation({
    mutationFn: adminGenerateSitemap,
    onSuccess: (result) => {
      void alert.success(`Sitemap generated (${result.urls} URLs).`)
    },
    onError: (e: unknown) => showError(messageFromUnknown(e)),
  })

  const openEdit = (row: SeoPageDto) => {
    setEditing(row)
    setMetaTitle(row.metaTitle ?? "")
    setMetaDescription(row.metaDescription ?? "")
    setMetaKeywords(row.metaKeywords ?? "")
  }

  const pages = listQuery.data?.pages ?? []
  const pagination = listQuery.data?.pagination
  const loading = listQuery.isLoading
  const generating = generateMut.isPending

  return (
    <div className="w-full space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink-heading sm:text-3xl">SEO pages</h1>
          <p className="mt-1 text-sm text-body-secondary">
            Edit meta tags for seeded public SPA paths. Generate sitemap on demand (also runs daily).
          </p>
        </div>
        <Button
          type="button"
          onClick={() => generateMut.mutate()}
          disabled={generating}
          className="gap-2"
        >
          {generating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Generate sitemap
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[16rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-body-secondary" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search path, page, or meta title…"
            className="w-full rounded-lg border border-chat-border-subtle bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-chat-accent"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-chat-border-subtle bg-card shadow-sm">
        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center gap-2 text-body-secondary">
            <Loader2 className="size-5 animate-spin" />
            Loading…
          </div>
        ) : pages.length === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center px-4 text-sm text-body-secondary">
            No SEO pages found. Run the SeoPageSeeder if the catalog is empty.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-chat-border-subtle bg-surface-soft/60 text-xs uppercase tracking-wide text-body-secondary">
                <tr>
                  <th className="px-4 py-3 font-medium">Page</th>
                  <th className="px-4 py-3 font-medium">Path</th>
                  <th className="px-4 py-3 font-medium">Meta title</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((row) => (
                  <tr key={row.id} className="border-b border-chat-border-subtle/70 last:border-0">
                    <td className="px-4 py-3 font-medium text-ink-heading">{row.pageName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-body-secondary">{row.path}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-body-secondary">
                      {row.metaTitle || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row)}>
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.lastPage > 1 ? (
          <div className="flex items-center justify-between gap-2 border-t border-chat-border-subtle px-4 py-3 text-sm">
            <span className="text-body-secondary">
              Page {pagination.currentPage} of {pagination.lastPage} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= pagination.lastPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="seo-edit-title"
            className="w-full max-w-lg rounded-2xl border border-chat-border-subtle bg-card p-5 shadow-lg"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="seo-edit-title" className="text-lg font-semibold text-ink-heading">
                  Edit SEO — {editing.pageName}
                </h2>
                <p className="mt-0.5 font-mono text-xs text-body-secondary">{editing.path}</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                className="rounded-lg p-1 text-body-secondary hover:bg-muted"
                onClick={() => setEditing(null)}
              >
                <X className="size-5" />
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                saveMut.mutate()
              }}
            >
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-ink-heading">Meta title</span>
                <input
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  maxLength={255}
                  className="w-full rounded-lg border border-chat-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-chat-accent"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-ink-heading">Meta description</span>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-chat-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-chat-accent"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-ink-heading">Meta keywords</span>
                <input
                  value={metaKeywords}
                  onChange={(e) => setMetaKeywords(e.target.value)}
                  maxLength={500}
                  className="w-full rounded-lg border border-chat-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-chat-accent"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMut.isPending} className={cn(saveMut.isPending && "opacity-80")}>
                  {saveMut.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
