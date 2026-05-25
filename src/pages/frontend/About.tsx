import { cmsConfigByType } from "@/features/cms/cmsConfig";
import { CmsPublicPage } from "@/pages/frontend/CmsPublicPage";

export default function About() {
  return <CmsPublicPage config={cmsConfigByType("about_us")} />;
}
