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
        <div className="container mx-auto p-2 md:p-4">
          <div className="min-w-0">{children}</div>
        </div>
      </main>
    </div>
  );
}
