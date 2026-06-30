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

  User,

  X,

} from "lucide-react";

import { useState } from "react";



import { getRoleDashboard } from "@/auth/rolePolicy";

import { hasAnyRole } from "@/auth/roles";

import type { AuthUser } from "@/auth/types";

import { useAuth } from "@/auth/useAuth";

import { GlobalBusinessSearch } from "@/components/search/GlobalBusinessSearch";

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



const VENDOR_LOGO_SRC = "/images/landing/gidira-logo-header.svg";

const VENDOR_DASHBOARD_PATH = "/user/profile";



function resolveVendorDashboardPath(user: AuthUser | null): string {

  if (hasAnyRole(user, "vendor")) {

    return getRoleDashboard("vendor") ?? VENDOR_DASHBOARD_PATH;

  }



  return getRoleDashboard("user") ?? VENDOR_DASHBOARD_PATH;

}



function HeaderToolbar({ dashboardPath }: { dashboardPath: string }) {

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

            <Button variant="ghost" className="h-auto p-1" aria-label="My account">

              <CircleUserRound className="size-6" />

            </Button>

          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">

            <DropdownMenuLabel>My Account</DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>

              <DropdownMenuItem onClick={() => navigate(dashboardPath)}>

                <LayoutGrid className="mr-2 h-4 w-4" />

                <span>Dashboard</span>

              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate(VENDOR_DASHBOARD_PATH)}>

                <User className="mr-2 h-4 w-4" />

                <span>Profile</span>

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

  dashboardPath,

  isAuthenticated,

  logout,

}: {

  dashboardPath: string;

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

          aria-label={open ? "Close menu" : "Open account menu"}

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

              <Link to={VENDOR_DASHBOARD_PATH} className="flex items-center gap-2 py-2">

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



export function VendorHeader({ onMenuClick }: { onMenuClick?: () => void }) {

  const { pathname } = useLocation();

  const { isAuthenticated, logout, user } = useAuth();

  const dashboardPath = resolveVendorDashboardPath(user);



  const isLightHeader =

    pathname === "/" ||

    pathname === "/service" ||

    pathname.startsWith("/businesses/") ||

    pathname === "/messages" ||

    pathname === "/reviews";

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

          <button

            type="button"

            onClick={onMenuClick}

            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"

            aria-label="Open sidebar"

          >

            <Menu className="size-5" />

          </button>



          <Link to={dashboardPath} className="inline-flex shrink-0 items-center">

            <div className="flex items-center gap-2">

              <img src={VENDOR_LOGO_SRC} alt="Gidira" className="h-8 w-auto" />

              <span className="text-sm font-semibold font-manrope text-[#1E3A8A]">

                Vendor

              </span>

            </div>

          </Link>



          <div className="flex items-center gap-1">

            <VendorNotificationBell />

            <MobileMenu

              dashboardPath={dashboardPath}

              isAuthenticated={isAuthenticated}

              logout={logout}

            />

          </div>

        </div>



        {showHeaderSearch ? <GlobalBusinessSearch variant="header" className="min-w-0 w-full" /> : null}

      </div>



      {/* Desktop */}

      <div className="hidden p-3 md:flex md:items-center md:gap-4 lg:gap-6 lg:py-4">

        <div className="flex justify-between min-w-0 flex-1 items-center gap-4 px-2">

          {showHeaderSearch ? (

            <GlobalBusinessSearch variant="header" className="min-w-0 w-full max-w-xl lg:max-w-2xl" />

          ) : (

            <div className="min-w-0 flex-1" />

          )}

          <HeaderToolbar dashboardPath={dashboardPath} />

        </div>

      </div>

    </header>

  );

}


