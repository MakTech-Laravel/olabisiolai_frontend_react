export type CmsPageType = "terms_and_conditions" | "privacy_policy" | "about_us";

export type CmsPageConfig = {
  type: CmsPageType;
  slug: string;
  label: string;
  adminPath: string;
  publicPath: string;
  defaultTitle: string;
};

export const CMS_PAGES: CmsPageConfig[] = [
  {
    type: "about_us",
    slug: "about-us",
    label: "About Us",
    adminPath: "/admin/cms/about-us",
    publicPath: "/about",
    defaultTitle: "About Us",
  },
  {
    type: "privacy_policy",
    slug: "privacy-policy",
    label: "Privacy Policy",
    adminPath: "/admin/cms/privacy-policy",
    publicPath: "/privacy-policy",
    defaultTitle: "Privacy Policy",
  },
  {
    type: "terms_and_conditions",
    slug: "terms-and-conditions",
    label: "Terms & Conditions",
    adminPath: "/admin/cms/terms-and-conditions",
    publicPath: "/terms",
    defaultTitle: "Terms & Conditions",
  },
];

export function cmsConfigBySlug(slug: string | undefined): CmsPageConfig | null {
  if (!slug) return null;
  return CMS_PAGES.find((p) => p.slug === slug) ?? null;
}

export function cmsConfigByType(type: CmsPageType): CmsPageConfig {
  return CMS_PAGES.find((p) => p.type === type)!;
}
