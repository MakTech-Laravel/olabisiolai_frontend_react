import { Suspense, useEffect, type ComponentType, type LazyExoticComponent } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { AppBottomNav } from "@/components/navigation/AppBottomNav";
import { shouldShowAppBottomNav } from "@/lib/appNavigation";

const pageFallback = (
  <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
    Loading…
  </div>
);

export function suspensePage(Comp: LazyExoticComponent<ComponentType>) {
  return (
    <Suspense fallback={pageFallback}>
      <Comp />
    </Suspense>
  );
}

/** Vendor shell is already visible — avoid a full-page Suspense flash in main. */
export function vendorSuspensePage(Comp: LazyExoticComponent<ComponentType>) {
  return (
    <Suspense fallback={null}>
      <Comp />
    </Suspense>
  );
}

export function ScrollToTopLayout() {
  const { pathname } = useLocation();
  const showBottomNav = shouldShowAppBottomNav(pathname);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("app-bottom-nav-active", showBottomNav);
    return () => {
      document.body.classList.remove("app-bottom-nav-active");
    };
  }, [showBottomNav]);

  return (
    <>
      <Outlet />
      <AppBottomNav />
    </>
  );
}
