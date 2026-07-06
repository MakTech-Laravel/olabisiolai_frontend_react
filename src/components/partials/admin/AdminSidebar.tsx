import {
  Building2,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  FileText,
  Gauge,
  KeyRound,
  Mail,
  MapPin,
  MessageSquare,
  ShieldCheck,
  ShieldUser,
  Star,
  Tags,
  Users,
  Wrench,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import type { ComponentType } from "react";
import { isSpatieSuperAdmin } from "@/auth/adminSpatie";
import { useAuth } from "@/auth/useAuth";
import { CMS_PAGES } from "@/features/cms/cmsConfig";
import { fetchAdminSidebarCounts } from "@/features/dashboard/adminSidebarApi";
import { cn } from "@/lib/utils";

type SidebarBadgeKey = "pending_verifications" | "pending_boosts";

type SidebarItem = {
  label: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
  permission?: string;
  badgeKey?: SidebarBadgeKey;
};

const staticItems: SidebarItem[] = [
  { label: "Dashboard", to: "/admin/dashboard", icon: Gauge, permission: "view dashboard" },
  { label: "Roles & permissions", to: "/admin/user-management/roles", icon: KeyRound, permission: "view roles" },
  { label: "Admins", to: "/admin/user-management/admin", icon: ShieldUser, permission: "view admins" },
  { label: "Users", to: "/admin/user-management/user", icon: Users },
  { label: "Businesses", to: "/admin/businesses", icon: Building2, permission: "view products" },
  { label: "Verifications", to: "/admin/verifications", icon: ClipboardCheck, badgeKey: "pending_verifications" },
  // { label: "Leads", to: "/admin/leads", icon: ListChecks, permission: "view orders" },
  { label: "Contact Us", to: "/admin/contact-us", icon: Mail },
  { label: "Messages", to: "/admin/messages", icon: MessageSquare, permission: "view orders" },
  { label: "Reviews", to: "/admin/reviews", icon: Star },
  { label: "Payments", to: "/admin/payments", icon: CircleDollarSign, permission: "view orders" },
  { label: "Subscription Plans", to: "/admin/subscription-plans", icon: CreditCard, permission: "view orders" },
  { label: "Boost System", to: "/admin/boost-system", icon: Wrench, badgeKey: "pending_boosts" },
  { label: "Categories", to: "/admin/categories", icon: Tags, permission: "view products" },
  // { label: "Career", to: "/admin/career", icon: UserRound },
  { label: "Locations", to: "/admin/locations", icon: MapPin },
  // { label: "Notifications", to: "/admin/notifications", icon: Bell },
  { label: "Settings", to: "/admin/settings", icon: ShieldCheck },
];

const SETTINGS_PATH = "/admin/settings";

type AdminSidebarProps = {
  mobileOpen?: boolean;
  onNavigate?: () => void;
};

function formatBadgeCount(count: number): string {
  if (count > 99) return "99+";
  return String(count);
}

function SidebarBadge({ count, loading }: { count: number; loading?: boolean }) {
  if (loading) {
    return (
      <span
        className="ml-auto h-5 w-5 shrink-0 animate-pulse rounded-full bg-chat-border-subtle"
        aria-hidden
      />
    );
  }

  if (count <= 0) return null;

  return (
    <span
      className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-red px-1.5 text-[10px] font-semibold leading-none text-ice"
      aria-label={`${count} pending`}
    >
      {formatBadgeCount(count)}
    </span>
  );
}

function SidebarLink({
  item,
  onNavigate,
  badgeCount,
  badgeLoading,
}: {
  item: SidebarItem;
  onNavigate?: () => void;
  badgeCount?: number;
  badgeLoading?: boolean;
}) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={() => onNavigate?.()}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive ? "bg-surface-soft text-chat-accent" : "text-body-secondary hover:bg-muted",
        )
      }
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badgeKey ? <SidebarBadge count={badgeCount ?? 0} loading={badgeLoading} /> : null}
    </NavLink>
  );
}

export function AdminSidebar({ mobileOpen = false, onNavigate }: AdminSidebarProps) {
  const { can, user } = useAuth();
  const location = useLocation();
  const superAdmin = isSpatieSuperAdmin(user);

  const sidebarCountsQuery = useQuery({
    queryKey: ["admin", "sidebar-counts"],
    queryFn: fetchAdminSidebarCounts,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const sidebarCounts = sidebarCountsQuery.data;
  const countsLoading = sidebarCountsQuery.isPending;

  const resolveBadgeCount = (key?: SidebarBadgeKey): number | undefined => {
    if (!key || !sidebarCounts) return undefined;
    return sidebarCounts[key];
  };

  const isVisible = (item: SidebarItem) =>
    !item.permission || superAdmin || can(item.permission);

  const itemsBeforeSettings = staticItems.filter(
    (item) => item.to !== SETTINGS_PATH && isVisible(item),
  );
  const settingsItem = staticItems.find((item) => item.to === SETTINGS_PATH);
  const showSettings = settingsItem && isVisible(settingsItem);

  const cmsActive = location.pathname.startsWith("/admin/cms");
  const [cmsOpen, setCmsOpen] = useState(cmsActive);

  useEffect(() => {
    if (cmsActive) setCmsOpen(true);
  }, [cmsActive]);

  return (
    <aside
      id="admin-sidebar-nav"
      className={cn(
        "flex w-[min(18rem,calc(100vw-3rem))] shrink-0 flex-col overflow-y-auto border-r border-chat-border-subtle bg-card sm:w-64",
        "fixed left-0 top-16 z-50 h-[calc(100dvh-4rem)] -translate-x-full transition-transform duration-200 ease-out sm:top-20 sm:h-[calc(100dvh-5rem)]",
        "lg:sticky lg:top-20 lg:z-auto lg:h-[calc(100dvh-5rem)] lg:translate-x-0 lg:self-start lg:shadow-none",
        mobileOpen && "translate-x-0 shadow-lg",
      )}
    >
      <div className="px-3 pb-4 pt-3 sm:px-4 sm:pb-6 sm:pt-4">
        <p className="text-base font-semibold text-ink-heading sm:text-lg">Dashboard</p>
        <p className="text-xs text-chat-meta">Manage your account</p>
      </div>

      <nav className="space-y-1 px-2 pb-4">
        {itemsBeforeSettings.map((item) => (
          <SidebarLink
            key={item.to}
            item={item}
            onNavigate={onNavigate}
            badgeCount={resolveBadgeCount(item.badgeKey)}
            badgeLoading={countsLoading && Boolean(item.badgeKey)}
          />
        ))}

        <div className="pt-1">
          <button
            type="button"
            onClick={() => setCmsOpen((open) => !open)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              cmsActive ? "bg-surface-soft text-chat-accent" : "text-body-secondary hover:bg-muted",
            )}
            aria-expanded={cmsOpen}
          >
            <FileText className="size-4 shrink-0" aria-hidden />
            <span className="flex-1 truncate text-left">CMS</span>
            <ChevronDown
              className={cn("size-4 shrink-0 transition-transform", cmsOpen && "rotate-180")}
              aria-hidden
            />
          </button>

          {cmsOpen ? (
            <div className="mt-1 space-y-0.5 pl-4">
              {CMS_PAGES.map((page) => (
                <NavLink
                  key={page.slug}
                  to={page.adminPath}
                  onClick={() => onNavigate?.()}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center rounded-lg py-2 pl-7 pr-3 text-sm transition-colors",
                      isActive
                        ? "bg-surface-soft font-medium text-chat-accent"
                        : "text-body-secondary hover:bg-muted",
                    )
                  }
                >
                  {page.label}
                </NavLink>
              ))}
            </div>
          ) : null}
        </div>

        {showSettings && settingsItem ? (
          <SidebarLink item={settingsItem} onNavigate={onNavigate} />
        ) : null}
      </nav>
    </aside>
  );
}

