import { Link, NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";
import { isActivePath } from "@/lib/nav.utils";
import { useActiveUrl } from "@/hooks/useActiveUrl";
import { Button } from "@/components/ui/button";
import {
  BadgeCheck,
  Banknote,
  BarChart2,
  Bell,
  LayoutGrid,
  Lock,
  MessageSquare,
  MessageSquareCheck,
  Rocket,
  Settings,
  User,
  X,
} from "lucide-react";
import logo from "@/assets/vendor/logo.jpeg";
import { useVendorSubscriptionAccess } from "@/hooks/useVendorSubscriptionAccess";

const items = [
  { to: "/vendor/dashboard", label: "Dashboard", icon: LayoutGrid, end: true, premiumOnly: false },
  { to: "/vendor/profile", label: "Profile", icon: User, premiumOnly: false },
  { to: "/vendor/leads", label: "Leads", icon: MessageSquare, premiumOnly: false },
  { to: "/vendor/notifications", label: "Notifications", icon: Bell, premiumOnly: false },
  { to: "/vendor/verification", label: "Verification", icon: BadgeCheck, premiumOnly: false },
  { to: "/vendor/boost", label: "Boost", icon: Rocket, premiumOnly: true },
  { to: "/vendor/analytics", label: "Analytics", icon: BarChart2, premiumOnly: true },
  { to: "/vendor/reviews", label: "Reviews", icon: MessageSquareCheck, premiumOnly: false },
  { to: "/vendor/payments", label: "Payments", icon: Banknote, premiumOnly: false },
  { to: "/vendor/settings", label: "Settings", icon: Settings, premiumOnly: false },
];

function SidebarCTA({
  canPayPremium,
  isPremiumActive,
  onUpgrade,
  onExploreBoosts,
}: {
  canPayPremium: boolean;
  isPremiumActive: boolean;
  onUpgrade: () => void;
  onExploreBoosts: () => void;
}) {
  if (isPremiumActive) {
    return (
      <div className="rounded-lg bg-[#003F87] p-4">
        <div className="flex gap-2">
          <Rocket className="text-text-white" />
          <p className="text-sm font-medium text-text-white mb-1">
            Boost Your Listings
          </p>
        </div>
        <p className="text-xs text-text-white/80 mb-3">
          Increase your visibility by up to 40%.
        </p>
        <Button className="w-full" variant="outline" size="sm" type="button" onClick={onExploreBoosts}>
          Get Started
        </Button>
      </div>
    );
  }

  if (!canPayPremium) {
    return null;
  }

  return (
    <div className="relative rounded-xl bg-[#003F87] overflow-hidden p-4">
      {/* Blurred ghost text in background */}
      <div className="absolute inset-0 p-3 select-none pointer-events-none">
        <p className="text-text-white/20 text-sm font-bold blur-[2px] leading-tight">
          Boost Plan
        </p>
        <p className="text-text-white/15 text-xs blur-[2px] mt-1 leading-snug">
          Reach 5× more customers today with a featured listing.
        </p>
      </div>

      {/* Foreground content */}
      <div className="relative z-10 flex flex-col items-center gap-3 pt-2">
        {/* Red lock badge */}
        <div className="w-11 h-11 rounded-full bg-red-500 flex items-center justify-center shadow-lg ring-4 ring-red-500/20">
          <Lock className="w-5 h-5 text-text-white" />
        </div>

        {/* Get Premium Access button */}
        <button
          type="button"
          onClick={onUpgrade}
          className="w-full cursor-pointer rounded-lg bg-red-500 px-3 py-2.5 text-sm font-semibold text-text-white shadow-md transition-all hover:bg-red-600 active:scale-[0.98]"
        >
          Get Premium Access
        </button>
      </div>
    </div>
  );
}

export function VendorSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { pathname } = useActiveUrl();

  const { isPremiumActive, canPayPremium, goToPremiumPayment, goToBoost } = useVendorSubscriptionAccess();

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-dvh w-65",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full",
          "md:static md:translate-x-0 md:h-dvh md:w-60 md:shrink-0",
          "flex flex-col bg-card",
        )}
      >
        {/* Mobile Close Button */}
        <div className="flex items-center justify-end px-4 pt-4 md:hidden">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Logo */}
        <Link to="/" className="px-4 pt-2 pb-2 text-center" onClick={onClose}>
          <img src={logo} alt="Gidira Vendor" className="h-full w-auto" />
        </Link>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4 mt-2 grid gap-1 content-start">
          {items.map((i) => {
            const Icon = i.icon;
            const locked = i.premiumOnly && !isPremiumActive;

            return (
              <NavLink
                key={i.to}
                to={i.to}
                end={i.end}
                className={() =>
                  cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-base font-normal font-inter transition-all",
                    locked && "opacity-70",
                    !locked && isActivePath(pathname, i.to, Boolean(i.end))
                      ? "text-base text-vendor-header font-semibold font-inter shadow-[0px_1px_2.4px_0px_rgba(0,0,0,0.24)]"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )
                }
              >
                {locked ? (
                  <Lock className="w-4 h-4 shrink-0" />
                ) : (
                  Icon && <Icon className="w-4 h-4 shrink-0" />
                )}
                <span>{i.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom CTA — plan-aware */}
        <div className="p-4">
          <SidebarCTA
            canPayPremium={canPayPremium}
            isPremiumActive={isPremiumActive}
            onUpgrade={goToPremiumPayment}
            onExploreBoosts={goToBoost}
          />
        </div>
      </aside>
    </>
  );
}
