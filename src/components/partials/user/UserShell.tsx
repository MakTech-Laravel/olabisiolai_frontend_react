import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";

import { FrontendHeader } from "@/components/partials/frontend/FrontendHeader";
import { UserSidebar, type UserSidebarActiveKey } from "@/components/partials/user/UserSidebar";
import { cn } from "@/lib/utils";

type UserShellProps = {
  active: UserSidebarActiveKey;
  children: ReactNode;
};

export function UserShell({ active, children }: UserShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-ink">
      <FrontendHeader />

      <main className="bg-auth-bg">
        <div className="mx-auto w-full max-w-[1400px] px-3 pt-3 sm:px-4 sm:pt-4 xl:px-8 xl:pt-6">
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              className={cn(
                "inline-flex size-10 items-center justify-center rounded-lg border border-chat-border-subtle bg-card text-ink hover:bg-muted",
                sidebarOpen && "bg-muted",
              )}
              aria-expanded={sidebarOpen}
              aria-controls="user-sidebar-nav"
              aria-label="Toggle account navigation"
            >
              <Menu className="size-5" aria-hidden />
            </button>
            <span className="text-sm font-medium text-ink-heading">Account menu</span>
          </div>
        </div>

        {sidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
            aria-label="Close navigation menu"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-0 px-3 pb-6 sm:px-4 sm:pb-8 lg:flex-row lg:gap-6 lg:pb-10 xl:px-8">
          <UserSidebar
            active={active}
            mobileOpen={sidebarOpen}
            onNavigate={() => setSidebarOpen(false)}
          />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </main>
    </div>
  );
}
