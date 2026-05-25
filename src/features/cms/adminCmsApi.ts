import { request } from "@/api/request";
import type { CmsPageType } from "@/features/cms/cmsConfig";
import { laravelInnerData, parseCmsPageDto } from "@/features/cms/cmsParsers";
import type { CmsPageDto } from "@/features/cms/types";
import { resolveMediaUrl } from "@/lib/mediaUrl";

export async function adminViewCmsPage(type: CmsPageType): Promise<CmsPageDto | null> {
  const res = await request.post("/admin/cms/view", { type });
  const inner = laravelInnerData(res.data) ?? {};
  return parseCmsPageDto(inner.page);
}

export async function adminUploadCmsImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await request.post("/admin/cms/upload-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const inner = laravelInnerData(res.data) ?? {};
  const url = typeof inner.url === "string" ? inner.url : "";
  if (!url) throw new Error("Invalid image upload response");
  return resolveMediaUrl(url);
}

export async function adminUpsertCmsPage(payload: {
  type: CmsPageType;
  title: string;
  description: string;
}): Promise<{ page: CmsPageDto; isCreated: boolean }> {
  const res = await request.post("/admin/cms/upsert", {
    type: payload.type,
    title: payload.title.trim(),
    description: payload.description,
  });
  const inner = laravelInnerData(res.data) ?? {};
  const page = parseCmsPageDto(inner.page);
  if (!page) throw new Error("Invalid CMS save response");
  return {
    page,
    isCreated: inner.is_created === true,
  };
}
