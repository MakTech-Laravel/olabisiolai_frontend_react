import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CircleUserRound,
  Home,
  LayoutGrid,
  LogIn,
  LogOut,
  Menu,
  Search,
  Settings,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { useState } from "react";

import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VendorNotificationBell } from "@/components/partials/vendor/VendorNotificationBell";
import { cn } from "@/lib/utils";
import logo from "@/assets/vendor/logo.jpeg";

function HeaderSearch({ className }: { className?: string }) {
  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Search by business name, category, or location..."
          className={cn(
            "h-11 w-full rounded-xl border border-border-light bg-[#F1F5F9] pl-10 pr-3 text-sm text-foreground",
            "outline-none ring-0 transition focus:border-brand/50",
          )}
        />
      </div>
    </div>
  );
}

function HeaderToolbar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
      <VendorNotificationBell />
      <Button
        type="button"
        variant="ghost"
        className="h-10 w-10 rounded-xl p-0"
        aria-label="Settings"
        onClick={() => navigate("/vendor/settings")}
      >
        <Settings className="size-5" />
      </Button>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto p-1">
              <CircleUserRound className="size-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate("/vendor/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/vendor/dashboard")}>
                <LayoutGrid className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function MobileMenu({
  showTradeNav,
  isAuthenticated,
  logout,
}: {
  showTradeNav: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-10 w-10 rounded-xl bg-brand-red p-0 text-ice shadow-md hover:bg-brand-red/90 hover:text-ice"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? (
            <X className="size-5" aria-hidden />
          ) : (
            <CircleUserRound className="size-5" aria-hidden />
          )}
        </Button>
      </DropdownMenuTrigger>
      {open ? (
        <button
          type="button"
          aria-label="Close menu overlay"
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <DropdownMenuContent
        align="end"
        collisionPadding={8}
        sideOffset={10}
        className="z-50 w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] rounded-2xl border-border-light p-3 shadow-xl md:hidden mr-1"
      >
        <div className="mb-1 flex items-center px-2 py-1">
          <DropdownMenuLabel className="p-0 text-sm font-semibold text-ink-heading">
            Quick Menu
          </DropdownMenuLabel>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="rounded-lg">
            <Link to="/" className="flex items-center gap-2 py-2">
              <Home className="size-4" aria-hidden />
              Home
            </Link>
          </DropdownMenuItem>
          {showTradeNav ? (
            <DropdownMenuItem asChild className="rounded-lg">
              <Link to="/trade" className="flex items-center gap-2 py-2">
                <TrendingUp className="size-4" aria-hidden />
                Trade
              </Link>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild className="rounded-lg">
            <Link to="/filters" className="flex items-center gap-2 py-2">
              <Search className="size-4" aria-hidden />
              Browse Businesses
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {isAuthenticated ? (
          <DropdownMenuItem
            onSelect={() => {
              void logout();
            }}
            className="rounded-lg text-brand-red focus:text-brand-red"
          >
            <LogOut className="size-4" aria-hidden />
            Logout
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild className="rounded-lg">
            <Link to="/user-type" className="flex items-center gap-2 py-2">
              <LogIn className="size-4" aria-hidden />
              Login / Sign Up
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function VendorHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const { pathname } = useLocation();
  const { isAuthenticated, logout } = useAuth();

  const isLightHeader =
    pathname === "/" ||
    pathname === "/trade" ||
    pathname === "/service" ||
    pathname.startsWith("/businesses/") ||
    pathname === "/messages" ||
    pathname === "/reviews";
  const showTradeNav = pathname !== "/trade";
  const showHeaderSearch = pathname !== "/";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b",
        isLightHeader
          ? "border-border-light bg-white text-foreground shadow-[0_1px_0_0_rgb(0_0_0_/0.04)]"
          : "border-border bg-background/90 text-foreground backdrop-blur-md",
      )}
    >
      {/* Mobile */}
      <div className="flex flex-col gap-3 px-4 py-3 md:hidden">
        <div className="flex items-center justify-between gap-3">
          {/* Hamburger — sidebar toggle */}
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="size-5" />
          </button>

          <Link to="/" className="inline-flex shrink-0 items-center">
            <div className="h-20 w-full">
              <img src={logo} alt="Gidira Vendor" className="h-full w-auto" />
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <VendorNotificationBell />
            <MobileMenu
              showTradeNav={showTradeNav}
              isAuthenticated={isAuthenticated}
              logout={logout}
            />
          </div>
        </div>

        {showHeaderSearch ? <HeaderSearch /> : null}
      </div>

      {/* Desktop */}
      <div className="hidden p-3 md:flex md:items-center md:gap-4 lg:gap-32 lg:py-4">
        <div className="flex min-w-0 flex-1 justify-between px-2">
          {showHeaderSearch ? (
            <HeaderSearch className="max-w-xl lg:max-w-2xl" />
          ) : null}
          <HeaderToolbar />
        </div>
      </div>
    </header>
  );
}
