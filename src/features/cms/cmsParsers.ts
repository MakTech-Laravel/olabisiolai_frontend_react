import type { CmsPageDto } from "@/features/cms/types";
import type { CmsPageType } from "@/features/cms/cmsConfig";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

const CMS_TYPES: CmsPageType[] = ["terms_and_conditions", "privacy_policy", "about_us"];

function isCmsPageType(value: string): value is CmsPageType {
  return (CMS_TYPES as string[]).includes(value);
}

export function parseCmsPageDto(raw: unknown): CmsPageDto | null {
  const o = asRecord(raw);
  if (!o) return null;

  const id = typeof o.id === "number" ? o.id : Number(o.id);
  if (!Number.isFinite(id)) return null;

  const typeRaw = typeof o.type === "string" ? o.type : "";
  if (!isCmsPageType(typeRaw)) return null;

  const title = typeof o.title === "string" ? o.title.trim() : "";
  const description = typeof o.description === "string" ? o.description : "";

  return {
    id,
    type: typeRaw,
    typeLabel: typeof o.type_label === "string" ? o.type_label : typeRaw,
    title,
    description,
    createdAt: typeof o.created_at === "string" ? o.created_at : "",
    updatedAt: typeof o.updated_at === "string" ? o.updated_at : "",
  };
}

export { laravelInnerData } from "@/features/categories/categoryParsers";
