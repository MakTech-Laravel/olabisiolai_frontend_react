import { Link, useLocation } from "react-router-dom";
import {
  Bell,
  CircleUserRound,
  Home,
  LayoutGrid,
  LocateFixed,
  LogIn,
  LogOut,
  Search,
  User,
  X,
} from "lucide-react";
import { NigeriaLocationMapModal } from "@/components/maps/NigeriaLocationMapModal";
import { GlobalBusinessSearch } from "@/components/search/GlobalBusinessSearch";
import { useEffect, useState } from "react";

import { getRoleDashboard } from "@/auth/rolePolicy";
import { getUserRoles, hasAnyRole } from "@/auth/roles";
import { useAuth } from "@/auth/useAuth";
import { HeaderAvatar } from "@/components/ui/HeaderAvatar";
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
import { container } from "@/lib/container";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { cn } from "@/lib/utils";
import { VendorNotificationBell } from "../vendor/VendorNotificationBell";

const LOGO_HEADER = "/images/landing/gidira-logo-header.svg";
const DEFAULT_HEADER_AVATAR = "/images/avatar/default-header-avatar.png";

function resolveUserAvatar(user: unknown): string {
  const userRecord = (user ?? {}) as Record<string, unknown>;
  const possibleKeys = [
    "image_url",
    "avatar_url",
    "avatar",
    "photo_url",
    "photo",
    "image",
    "image_path",
  ] as const;

  for (const key of possibleKeys) {
    const value = userRecord[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return resolveMediaUrl(value, DEFAULT_HEADER_AVATAR);
    }
  }

  return DEFAULT_HEADER_AVATAR;
}

function ActivityBellLink() {
  return (
    <Button
      asChild
      type="button"
      variant="ghost"
      className="relative h-10 w-10 rounded-xl p-0 text-foreground hover:bg-[#F1F5F9]"
      aria-label="Notifications"
    >
      <Link to="/user/activity">
        <Bell className="size-5" />
      </Link>
    </Button>
  );
}

function HeaderToolbar({
  isLightHeader,
  dashboardPath,
  showLocationPicker,
  onOpenLocationMap,
}: {
  isLightHeader: boolean;
  dashboardPath: string;
  showLocationPicker: boolean;
  onOpenLocationMap: () => void;
}) {
  const { isAuthenticated, logout, user } = useAuth();
  const avatarSrc = resolveUserAvatar(user);
  const showActivityBell = isAuthenticated && hasAnyRole(user, ["user", "vendor"]);
  const profilePath = "/user/profile";

  const regionTrigger = cn(
    "h-11 rounded-full border border-[#9CA3AF] bg-[#E5E7EB] px-5 text-base font-medium text-[#191B23] shadow-none",
    "hover:bg-[#DDE1E6]",
  );

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
      {showLocationPicker ? (
        <Button
          type="button"
          variant="outline"
          className={regionTrigger}
          onClick={onOpenLocationMap}
          aria-label="Choose location on map"
        >
          Nigeria
          <LocateFixed className="size-4 text-blue-500" aria-hidden />
        </Button>
      ) : null}

      {showActivityBell ? <VendorNotificationBell /> : null}

      {isAuthenticated ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-10 w-10 overflow-hidden rounded-full p-0",
                isLightHeader
                  ? "border-[#2563eb] bg-white text-[#2563eb] hover:bg-muted"
                  : "border-border-gray bg-white text-ink-heading",
              )}
              aria-label="My account"
            >
              <HeaderAvatar src={avatarSrc} alt="Account" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={dashboardPath} className="flex items-center gap-2">
                <LayoutGrid className="size-4" aria-hidden />
                Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={profilePath} className="flex items-center gap-2">
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
      ) : (
        <Button
          asChild
          type="button"
          variant="outline"
          className={cn(
            "h-11 rounded-lg border-border-gray bg-white px-5 text-base font-medium text-ink-heading shadow-none",
            "hover:border-brand hover:bg-brand hover:text-ice",
          )}
        >
          <Link to="/login/phone">Login / Sign Up</Link>
        </Button>
      )}
    </div>
  );
}

function MobileMenu({
  isAuthenticated,
  logout,
  avatarSrc,
  dashboardPath,
  isVendor,
  profilePath,
}: {
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  avatarSrc: string;
  dashboardPath: string;
  isVendor: boolean;
  profilePath: string;
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
          ) : isAuthenticated && !isVendor ? (
            <span className="block size-8 overflow-hidden rounded-full">
              <HeaderAvatar src={avatarSrc} alt="Account" className="size-8" />
            </span>
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
          {isAuthenticated ? (
            <DropdownMenuItem asChild className="rounded-lg">
              <Link to={dashboardPath} className="flex items-center gap-2 py-2">
                <LayoutGrid className="size-4" aria-hidden />
                Dashboard
              </Link>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild className="rounded-lg">
            <Link to="/" className="flex items-center gap-2 py-2">
              <Home className="size-4" aria-hidden />
              Home
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-lg">
            <Link to="/filters" className="flex items-center gap-2 py-2">
              <Search className="size-4" aria-hidden />
              Browse Businesses
            </Link>
          </DropdownMenuItem>
          {isAuthenticated ? (
            <DropdownMenuItem asChild className="rounded-lg">
              <Link to={profilePath} className="flex items-center gap-2 py-2">
                <User className="size-4" aria-hidden />
                Profile
              </Link>
            </DropdownMenuItem>
          ) : null}
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
            <Link to="/login/phone" className="flex items-center gap-2 py-2">
              <LogIn className="size-4" aria-hidden />
              Login / Sign Up
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FrontendHeader({ compactOnMobile = false }: { compactOnMobile?: boolean }) {
  const { pathname } = useLocation();
  const [locationMapOpen, setLocationMapOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const primaryRole = getUserRoles(user)[0];
  const dashboardPath = primaryRole ? getRoleDashboard(primaryRole) ?? "/user/dashboard" : "/user/dashboard";
  const isVendor = hasAnyRole(user, "vendor");
  const showActivityBell = isAuthenticated && hasAnyRole(user, ["user", "vendor"]);
  const profilePath = "/user/profile";
  const isLightHeader =
    pathname === "/" ||
    pathname === "/service" ||
    pathname.startsWith("/businesses/") ||
    pathname === "/messages" ||
    pathname.startsWith("/user/messages") ||
    pathname === "/reviews";
  const showHeaderSearch = pathname !== "/" && !(compactOnMobile && pathname.startsWith("/user/messages"));
  const isFiltersPage = pathname === "/filters";
  const showLocationPicker = !isFiltersPage;
  const avatarSrc = resolveUserAvatar(user);

  useEffect(() => {
    if (isFiltersPage) {
      setLocationMapOpen(false);
    }
  }, [isFiltersPage]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 shrink-0 border-b",
        isLightHeader
          ? "border-border-light bg-white text-foreground shadow-[0_1px_0_0_rgb(0_0_0_/0.04)]"
          : "border-border bg-background/90 text-foreground backdrop-blur-md",
      )}
    >
      <div className={cn(container, "flex flex-col gap-3 py-3 md:hidden", compactOnMobile && "gap-2 py-2")}>
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex shrink-0 items-center">
            <img
              src={LOGO_HEADER}
              alt="Gidira"
              width={155}
              height={48}
              decoding="async"
              className="block h-8 w-auto"
            />
          </Link>
          <div className="flex items-center gap-1">
            {showActivityBell ? <ActivityBellLink /> : null}
            <MobileMenu
              isAuthenticated={isAuthenticated}
              logout={logout}
              avatarSrc={avatarSrc}
              dashboardPath={dashboardPath}
              isVendor={isVendor}
              profilePath={profilePath}
            />
          </div>
        </div>
        {showHeaderSearch ? <GlobalBusinessSearch variant="header" className="min-w-0 w-full" /> : null}
      </div>

      <div
        className={cn(
          container,
          "hidden py-3 md:flex md:items-center md:gap-4 lg:gap-6 lg:py-4",
        )}
      >
        <Link to="/" className="inline-flex shrink-0 items-center">
          <img
            src={LOGO_HEADER}
            alt="Gidira"
            width={155}
            height={48}
            decoding="async"
            className="block h-9 w-auto lg:h-10"
          />
        </Link>

        <div className="flex min-w-0 flex-1 justify-center px-2">
          {showHeaderSearch ? (
            <GlobalBusinessSearch variant="header" className="min-w-0 w-full max-w-xl lg:max-w-2xl" />
          ) : null}
        </div>

        <HeaderToolbar
          isLightHeader={isLightHeader}
          dashboardPath={dashboardPath}
          showLocationPicker={showLocationPicker}
          onOpenLocationMap={() => setLocationMapOpen(true)}
        />
      </div>

      {showLocationPicker ? (
        <NigeriaLocationMapModal
          open={locationMapOpen}
          onClose={() => setLocationMapOpen(false)}
        />
      ) : null}
    </header>
  );
}
