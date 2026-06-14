import { lazy } from "react";
import { Outlet, type RouteObject } from "react-router-dom";

import { RoleGate } from "@/routes/RoleGate";
import { suspensePage } from "@/routes/routeUtils";

const UserDashboard = lazy(() => import("@/pages/user/UserDashboard"));
const UnifiedProfile = lazy(() => import("@/pages/user/UnifiedProfile"));
const Favorites = lazy(() => import("@/pages/user/Favorites"));
const Messages = lazy(() => import("@/pages/user/Messages"));
const UserActivity = lazy(() => import("@/pages/user/UserActivity"));
const SettingsHub = lazy(() => import("@/pages/user/SettingsHub"));
const AccountSettings = lazy(() => import("@/pages/user/AccountSettings"));
const MyReviews = lazy(() => import("@/pages/user/MyReviews"));
const ReportIssue = lazy(() => import("@/pages/user/ReportIssue"));
const Account = lazy(() => import("@/pages/frontend/Account"));

/** Authenticated account area (customers + vendors share profile hub, settings, messages). */
export const userRoutes: RouteObject = {
  element: (
    <RoleGate allow={["user", "vendor"]} fallback="/unauthorized">
      <Outlet />
    </RoleGate>
  ),
  children: [
    { path: "/user/dashboard", element: suspensePage(UserDashboard) },
    { path: "/user/profile", element: suspensePage(UnifiedProfile) },
    { path: "/user/favorites", element: suspensePage(Favorites) },
    { path: "/user/messages", element: suspensePage(Messages) },
    { path: "/user/activity", element: suspensePage(UserActivity) },
    { path: "/user/settings", element: suspensePage(SettingsHub) },
    { path: "/user/settings/account", element: suspensePage(AccountSettings) },
    { path: "/user/reviews", element: suspensePage(MyReviews) },
    { path: "/user/report", element: suspensePage(ReportIssue) },
    { path: "/account", element: suspensePage(Account) },
  ],
};
