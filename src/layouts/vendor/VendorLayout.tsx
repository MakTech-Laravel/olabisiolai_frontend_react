import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import { useNav } from "@/hooks/useNav";
import { VendorHeader } from "@/components/partials/vendor/VendorHeader";
import { VendorAccessGuard } from "@/components/partials/vendor/VendorAccessGuard";
import { VendorSidebar } from "@/components/partials/vendor/VendorSidebar";

export function VendorLayout() {
  const nav = useNav();

  useEffect(() => {
    document.documentElement.classList.add("vendor-app-shell");
    return () => document.documentElement.classList.remove("vendor-app-shell");
  }, []);

  return (
    <div className="flex h-dvh overflow-hidden bg-vendor-body-bg">
      <VendorSidebar open={nav.open} onClose={nav.close} />

      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        <VendorHeader onMenuClick={() => nav.toggle()} />

        <main className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain">
          <VendorAccessGuard>
            <Outlet />
          </VendorAccessGuard>
        </main>
      </div>
    </div>
  );
}