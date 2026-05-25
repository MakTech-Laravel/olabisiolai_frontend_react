import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import type { CmsPageConfig } from "@/features/cms/cmsConfig";
import { hasCmsHtmlContent, resolveCmsHtmlMedia } from "@/features/cms/cmsHtml";
import { fetchPublicCmsPage } from "@/features/cms/publicCmsApi";
import { container } from "@/lib/container";
import { cn } from "@/lib/utils";

type CmsPublicPageProps = {
  config: CmsPageConfig;
};

export function CmsPublicPage({ config }: CmsPublicPageProps) {
  const pageQuery = useQuery({
    queryKey: ["public", "cms", config.type],
    queryFn: () => fetchPublicCmsPage(config),
    staleTime: 5 * 60 * 1000,
  });

  const page = pageQuery.data;
  const title = page?.title ?? config.defaultTitle;
  const updatedAt = page?.updatedAt;

  const renderedHtml = useMemo(() => {
    if (!page?.description) return "";
    return resolveCmsHtmlMedia(page.description);
  }, [page?.description]);

  const hasContent = hasCmsHtmlContent(renderedHtml);

  return (
    <div className="w-full bg-muted">
      <div className={cn(container, "flex w-full flex-col gap-6 py-10 sm:gap-8 sm:py-14")}>
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold leading-10 text-ink-heading sm:text-4xl">{title}</h1>
          {updatedAt ? (
            <p className="text-sm text-body-secondary">Last updated: {updatedAt}</p>
          ) : null}
        </header>

        <article className="w-full rounded-2xl border border-border-gray bg-card p-6 shadow-sm sm:p-8">
          {pageQuery.isLoading ? (
            <div className="flex min-h-[200px] items-center justify-center gap-2 text-body-secondary">
              <Loader2 className="size-5 animate-spin" />
              Loading…
            </div>
          ) : pageQuery.isError || !page || !hasContent ? (
            <p className="text-sm leading-6 text-body-secondary">
              Content for this page is not available yet. Please check back later.
            </p>
          ) : (
            <div
              className={cn(
                "cms-public-content w-full max-w-none text-base leading-7 text-body-secondary [&::after]:table [&::after]:clear-both [&::after]:content-['']",
                "[&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-ink-heading",
                "[&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink-heading",
                "[&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink-heading",
                "[&_p]:mb-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6",
                "[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-chat-accent [&_blockquote]:pl-4 [&_blockquote]:italic",
                "[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:text-sm",
                "[&_img]:block [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg",
                "[&_iframe]:my-4 [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-lg",
                "[&_video]:my-4 [&_video]:w-full [&_video]:max-w-full [&_video]:rounded-lg",
                "[&_.cms-tiptap-youtube]:my-4 [&_.cms-tiptap-youtube]:aspect-video [&_.cms-tiptap-youtube]:w-full",
                "[&_a]:font-medium [&_a]:text-chat-accent [&_a]:underline",
              )}
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          )}
        </article>
      </div>
    </div>
  );
}
