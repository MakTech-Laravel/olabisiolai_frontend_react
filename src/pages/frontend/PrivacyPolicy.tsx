import { cmsConfigByType } from "@/features/cms/cmsConfig";
import { CmsPublicPage } from "@/pages/frontend/CmsPublicPage";

export default function PrivacyPolicy() {
  return <CmsPublicPage config={cmsConfigByType("privacy_policy")} />;
}
