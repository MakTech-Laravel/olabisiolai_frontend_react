import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router-dom";

import { AdminLayout } from "@/layouts/admin/AdminLayout";
import { AdminUserManagementIndexRedirect } from "@/routes/AdminUserManagementIndexRedirect";
import { PermissionGate } from "@/routes/PermissionGate";
import { RoleGate } from "@/routes/RoleGate";
import { suspensePage } from "@/routes/routeUtils";

const adminDenied = "/admin/dashboard";

const Dashboard = lazy(() => import("@/pages/admin/Dashboard"));
const Users = lazy(() => import("@/pages/admin/Users"));
const Businesses = lazy(() => import("@/pages/admin/Businesses"));
const Categories = lazy(() => import("@/pages/admin/Categories"));
const Career = lazy(() => import("@/pages/admin/Career"));
const CareerEdit = lazy(() => import("@/pages/admin/CareerEdit"));
const Locations = lazy(() => import("@/pages/admin/Locations"));
const Settings = lazy(() => import("@/pages/admin/Settings"));
const Notifications = lazy(() => import("@/pages/admin/Notifications"));
const Verifications = lazy(() => import("@/pages/admin/Verifications"));
const AdminVerificationDetail = lazy(() => import("@/pages/admin/AdminVerificationDetail"));
const Leads = lazy(() => import("@/pages/admin/Leads"));
const ContactMessages = lazy(() => import("@/pages/admin/ContactMessages"));
const AdminMessages = lazy(() => import("@/pages/admin/AdminMessages"));
const Reviews = lazy(() => import("@/pages/admin/Reviews"));
const Payments = lazy(() => import("@/pages/admin/Payments"));
const BoostSystem = lazy(() => import("@/pages/admin/BoostSystem"));
const AdminBoostRequestDetail = lazy(() => import("@/pages/admin/AdminBoostRequestDetail"));
const UserManagement = lazy(() => import("@/pages/admin/UserManagement"));
const AdminAccounts = lazy(() => import("@/pages/admin/AdminAccounts"));
const CmsEdit = lazy(() => import("@/pages/admin/CmsEdit"));

/**
 * User-management URLs mirror `blogging_rasta_laravel` `routes/admin.php`:
 * - `/admin/user-management/admin` — administrator accounts
 * - `/admin/user-management/user` — site users (vendors, customers, etc.)
 * - `/admin/user-management/roles` — Spatie roles & permissions (API-backed SPA)
 */
export const adminRoutes: RouteObject = {
  element: (
    <RoleGate allow="admin" fallback="/admin/login">
      <AdminLayout />
    </RoleGate>
  ),
  children: [
    { path: "/admin", element: <Navigate to="/admin/dashboard" replace /> },
    {
      path: "/admin/dashboard",
      element: (
        <PermissionGate permission="view dashboard" fallback="/admin/login">
          {suspensePage(Dashboard)}
        </PermissionGate>
      ),
    },
    { path: "/admin/user-management", element: <AdminUserManagementIndexRedirect /> },
    {
      path: "/admin/user-management/admin",
      element: (
        <PermissionGate permission="view admins" fallback={adminDenied}>
          {suspensePage(AdminAccounts)}
        </PermissionGate>
      ),
    },
    { path: "/admin/user-management/user", element: suspensePage(Users) },
    {
      path: "/admin/user-management/roles",
      element: (
        <PermissionGate permission="view roles" fallback={adminDenied}>
          {suspensePage(UserManagement)}
        </PermissionGate>
      ),
    },
    { path: "/admin/users", element: <Navigate to="/admin/user-management/user" replace /> },
    {
      path: "/admin/businesses",
      element: (
        <PermissionGate permission="view products" fallback={adminDenied}>
          {suspensePage(Businesses)}
        </PermissionGate>
      ),
    },
    {
      path: "/admin/categories",
      element: (
        <PermissionGate permission="view products" fallback={adminDenied}>
          {suspensePage(Categories)}
        </PermissionGate>
      ),
    },
    { path: "/admin/cms", element: <Navigate to="/admin/cms/about-us" replace /> },
    { path: "/admin/cms/:slug", element: suspensePage(CmsEdit) },
    { path: "/admin/career", element: suspensePage(Career) },
    { path: "/admin/career/add", element: suspensePage(CareerEdit) },
    { path: "/admin/career/edit/:id", element: suspensePage(CareerEdit) },
    { path: "/admin/settings", element: suspensePage(Settings) },
    { path: "/admin/locations", element: suspensePage(Locations) },
    { path: "/admin/notifications", element: suspensePage(Notifications) },
    { path: "/admin/verifications", element: suspensePage(Verifications) },
    {
      path: "/admin/verifications/:businessId",
      element: suspensePage(AdminVerificationDetail),
    },
    {
      path: "/admin/leads",
      element: (
        <PermissionGate permission="view orders" fallback={adminDenied}>
          {suspensePage(Leads)}
        </PermissionGate>
      ),
    },
    { path: "/admin/contact-us", element: suspensePage(ContactMessages) },
    {
      path: "/admin/contact-messages",
      element: <Navigate to="/admin/contact-us" replace />,
    },
    {
      path: "/admin/messages",
      element: (
        <PermissionGate permission="view orders" fallback={adminDenied}>
          {suspensePage(AdminMessages)}
        </PermissionGate>
      ),
    },
    { path: "/admin/reviews", element: suspensePage(Reviews) },
    {
      path: "/admin/payments",
      element: (
        <PermissionGate permission="view orders" fallback={adminDenied}>
          {suspensePage(Payments)}
        </PermissionGate>
      ),
    },
    { path: "/admin/boost-system", element: suspensePage(BoostSystem) },
    {
      path: "/admin/boost-system/:requestId",
      element: suspensePage(AdminBoostRequestDetail),
    },
  ],
};
