import { cmsConfigByType } from "@/features/cms/cmsConfig";
import { CmsPublicPage } from "@/pages/frontend/CmsPublicPage";

export default function DeleteAccount() {
  return <CmsPublicPage config={cmsConfigByType("delete_account")} />;
}
