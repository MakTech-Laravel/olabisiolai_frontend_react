import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Button } from "@/components/ui/button";
import { cmsConfigBySlug } from "@/features/cms/cmsConfig";
import { adminUpsertCmsPage, adminViewCmsPage } from "@/features/cms/adminCmsApi";
import { alert, showError } from "@/lib/sweetAlert";

function messageFromUnknown(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return "Something went wrong. Please try again.";
}

export default function CmsEdit() {
  const { slug } = useParams<{ slug: string }>();
  const config = cmsConfigBySlug(slug);
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const pageQuery = useQuery({
    queryKey: ["admin", "cms", config?.type],
    queryFn: () => adminViewCmsPage(config!.type),
    enabled: Boolean(config),
  });

  useEffect(() => {
    setHydrated(false);
  }, [slug]);

  useEffect(() => {
    if (!config || pageQuery.isLoading) return;
    const page = pageQuery.data;
    setTitle(page?.title ?? config.defaultTitle);
    setDescription(page?.description ?? "");
    setHydrated(true);
  }, [config, pageQuery.data, pageQuery.isLoading, slug]);

  const saveMut = useMutation({
    mutationFn: () =>
      adminUpsertCmsPage({
        type: config!.type,
        title,
        description,
      }),
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: ["admin", "cms", config?.type] });
      void qc.invalidateQueries({ queryKey: ["public", "cms", config?.type] });
      alert.success(
        result.isCreated ? "CMS page created successfully." : "CMS page updated successfully.",
      );
    },
    onError: (e: unknown) => showError(messageFromUnknown(e)),
  });

  if (!config) {
    return <Navigate to="/admin/cms/about-us" replace />;
  }

  const saving = saveMut.isPending;
  const loading = pageQuery.isLoading || !hydrated;

  return (
    <div className="w-full space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink-heading sm:text-3xl">CMS — {config.label}</h1>
          <p className="mt-1 text-sm text-body-secondary">
            Edit page content shown on the public site. Saving updates the live page.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to={config.publicPath} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" />
            View public page
          </Link>
        </Button>
      </div>

      <div className="w-full rounded-2xl border border-chat-border-subtle bg-card p-5 shadow-sm sm:p-6">
        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center gap-2 text-body-secondary">
            <Loader2 className="size-5 animate-spin" />
            Loading…
          </div>
        ) : (
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim()) {
                showError("Title is required.");
                return;
              }
              const plainText = description.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
              if (!plainText) {
                showError("Description is required.");
                return;
              }
              saveMut.mutate();
            }}
          >
            <div className="flex flex-col gap-2">
              <label htmlFor="cms-title" className="text-sm font-medium text-ink">
                Title
              </label>
              <input
                id="cms-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={saving}
                className="w-full rounded-lg border border-border-gray px-3 py-2 text-sm outline-none focus:border-chat-accent focus:ring-1 focus:ring-chat-accent"
                placeholder={config.defaultTitle}
              />
            </div>

            <div className="flex w-full flex-col gap-2">
              <label className="text-sm font-medium text-ink">Description</label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Write page content…"
                minHeight="480px"
                className="w-full"
              />
              {pageQuery.data?.updatedAt ? (
                <p className="text-xs text-chat-meta">Last saved: {pageQuery.data.updatedAt}</p>
              ) : (
                <p className="text-xs text-chat-meta">No saved version yet — publish when ready.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-border-gray pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Save page
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
