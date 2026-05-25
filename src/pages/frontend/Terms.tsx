import { cmsConfigByType } from "@/features/cms/cmsConfig";
import { CmsPublicPage } from "@/pages/frontend/CmsPublicPage";

export default function Terms() {
  return <CmsPublicPage config={cmsConfigByType("terms_and_conditions")} />;
}
