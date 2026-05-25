import { request } from "@/api/request";
import type { CmsPageConfig } from "@/features/cms/cmsConfig";
import { laravelInnerData, parseCmsPageDto } from "@/features/cms/cmsParsers";
import type { CmsPageDto } from "@/features/cms/types";

/** Public CMS pages: GET /api/v1/about, /privacy-policy, /terms (no /cms prefix). */
export async function fetchPublicCmsPage(config: CmsPageConfig): Promise<CmsPageDto | null> {
  const path = config.publicPath.replace(/^\//, "");
  const res = await request.get(`/${path}`);
  const inner = laravelInnerData(res.data) ?? {};
  return parseCmsPageDto(inner.page);
}
