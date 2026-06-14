import { lazy } from "react";
import { Outlet, type RouteObject } from "react-router-dom";

import { RoleGate } from "@/routes/RoleGate";
import { suspensePage } from "@/routes/routeUtils";

const UserDashboard = lazy(() => import("@/pages/user/UserDashboard"));
const UnifiedProfile = lazy(() => import("@/pages/user/UnifiedProfile"));
const Favorites = lazy(() => import("@/pages/user/Favorites"));
const Messages = lazy(() => import("@/pages/user/Messages"));
const UserActivity = lazy(() => import("@/pages/user/UserActivity"));
const Settings = lazy(() => import("@/pages/user/Settings"));
const Account = lazy(() => import("@/pages/frontend/Account"));

/** Authenticated `user` role area. */
export const userRoutes: RouteObject = {
  element: (
    <RoleGate allow="user" fallback="/unauthorized">
      <Outlet />
    </RoleGate>
  ),
  children: [
    { path: "/user/dashboard", element: suspensePage(UserDashboard) },
    { path: "/user/profile", element: suspensePage(UnifiedProfile) },
    { path: "/user/favorites", element: suspensePage(Favorites) },
    { path: "/user/messages", element: suspensePage(Messages) },
    { path: "/user/activity", element: suspensePage(UserActivity) },
    { path: "/user/settings", element: suspensePage(Settings) },
    { path: "/account", element: suspensePage(Account) },
  ],
};
