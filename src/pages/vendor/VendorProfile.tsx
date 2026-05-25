import { Loader2 } from "lucide-react";

import { BusinessGallerySection } from "@/components/sections/vendor/profile/BusinessGallerySection";
import { BusinessInfoCard } from "@/components/sections/vendor/profile/BusinessInfoCard";
import { BusinessHoursCard } from "@/components/sections/vendor/profile/BusinessHoursCard";
import { ContactLinksCard } from "@/components/sections/vendor/profile/ContactLinksCard";
import { ProfileManagementHeader } from "@/components/sections/vendor/profile/ProfileManagementHeader";
import { ProfileVisibilityCard } from "@/components/sections/vendor/profile/ProfileVisibilityCard";
import { VendorProfileProvider } from "@/components/sections/vendor/profile/VendorProfileContext";
import { useVendorSubscriptionAccess } from "@/hooks/useVendorSubscriptionAccess";

function VendorProfileContent() {
  const { isPremiumActive, isLoading } = useVendorSubscriptionAccess();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <Loader2 className="size-8 animate-spin text-brand-red" aria-label="Loading profile" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full space-y-6 p-4 md:space-y-8 md:p-6 lg:px-8">
      <ProfileManagementHeader />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.85fr)_minmax(300px,1fr)] lg:items-start lg:gap-6 xl:gap-8">
        <div className="flex w-full min-w-0 flex-col gap-5 self-start">
          <BusinessInfoCard />
          <BusinessGallerySection variant={isPremiumActive ? "premium" : "free"} />
        </div>

        <div className="flex w-full min-w-0 flex-col gap-5 self-start">
          <BusinessHoursCard />
          <ProfileVisibilityCard />
          <ContactLinksCard />
        </div>
      </div>
    </div>
  );
}

export default function VendorProfile() {
  return (
    <VendorProfileProvider>
      <VendorProfileContent />
    </VendorProfileProvider>
  );
}
