import type { CmsPageType } from "@/features/cms/cmsConfig";

export type CmsPageDto = {
  id: number;
  type: CmsPageType;
  typeLabel: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};
