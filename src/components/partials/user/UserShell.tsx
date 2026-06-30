import type { ReactNode } from "react";

import { FrontendHeader } from "@/components/partials/frontend/FrontendHeader";

type UserShellProps = {
  children: ReactNode;
};

export function UserShell({ children }: UserShellProps) {
  return (
    <div className="min-h-screen bg-background text-ink">
      <FrontendHeader />

      <main className="bg-auth-bg">
        <div className="mx-auto w-full max-w-[1400px] px-3 pb-6 sm:px-4 sm:pb-8 xl:px-8 xl:pb-10">
          <div className="min-w-0">{children}</div>
        </div>
      </main>
    </div>
  );
}
