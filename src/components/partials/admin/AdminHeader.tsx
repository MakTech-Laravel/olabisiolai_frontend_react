import { ChevronDown, LogOut, Menu, UserRound, User } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "@/auth/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type AdminHeaderProps = {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
};

export function AdminHeader({ sidebarOpen = false, onToggleSidebar }: AdminHeaderProps) {
  const { logout, user } = useAuth();
  const displayName = user?.name?.trim() || "Admin User";
  const displayEmail = user?.email?.trim() || "admin@gidira.com";

  return (
    <header className="sticky top-0 z-50 flex min-h-16 items-center justify-between gap-2 border-b border-chat-border-subtle bg-card px-3 py-2 sm:h-20 sm:px-4 sm:py-0 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {onToggleSidebar ? (
          <button
            type="button"
            onClick={onToggleSidebar}
            className={cn(
              "inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-chat-border-subtle text-ink hover:bg-muted lg:hidden",
              sidebarOpen && "bg-muted",
            )}
            aria-expanded={sidebarOpen}
            aria-controls="admin-sidebar-nav"
            aria-label="Toggle navigation menu"
          >
            <Menu className="size-5" aria-hidden />
          </button>
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-2xl font-semibold leading-8 text-ink sm:text-3xl sm:leading-9">Gidira</p>
          <p className="hidden truncate text-sm text-chat-meta sm:block">Admin Dashboard</p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex max-w-[min(100%,14rem)] items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted sm:max-w-none sm:gap-3 sm:px-3 sm:py-2"
          >
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-ice">
              <UserRound className="size-4" aria-hidden />
            </span>
            <span className="hidden min-w-0 text-left sm:block">
              <span className="block truncate text-sm font-medium text-ink">{displayName}</span>
              <span className="block truncate text-xs text-chat-meta">{displayEmail}</span>
            </span>
            <ChevronDown className="size-4 shrink-0 text-chat-meta" aria-hidden />
            <span className="sr-only">Open account menu</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/admin/dashboard" className="flex cursor-pointer items-center gap-2">
              <User className="size-4" aria-hidden />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              void logout();
            }}
            className="text-brand-red focus:text-brand-red"
          >
            <LogOut className="size-4" aria-hidden />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
