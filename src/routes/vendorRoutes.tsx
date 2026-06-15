import { lazy } from "react";
import { Navigate, type RouteObject } from "react-router-dom";

import { VendorLayout } from "@/layouts/vendor/VendorLayout";
import { RoleGate } from "@/routes/RoleGate";
import { suspensePage, vendorSuspensePage } from "@/routes/routeUtils";

const VendorDashboardWrapper = lazy(() => import("@/pages/vendor/VendorDashboardWrapper"));
const VendorProfile = lazy(() => import("@/pages/vendor/RedirectToOwnerBusinessProfile"));
const VendorLeads = lazy(() => import("@/pages/vendor/VendorLeads"));
const VendorVerification = lazy(() => import("@/pages/vendor/VendorVerification"));
const VendorBoost = lazy(() => import("@/pages/vendor/VendorBoost"));
const VendorBoostConfigure = lazy(() => import("@/pages/vendor/VendorBoostConfigure"));
const VendorBoostReviewPay = lazy(() => import("@/pages/vendor/VendorBoostReviewPay"));
const VendorAnalytics = lazy(() => import("@/pages/vendor/VendorAnalytics"));
const VendorReviews = lazy(() => import("@/pages/vendor/VendorReviews"));
const VendorPayments = lazy(() => import("@/pages/vendor/VendorPayments"));
const VendorPaymentDetail = lazy(() => import("@/pages/vendor/VendorPaymentDetail"));
const VendorSettings = lazy(() => import("@/pages/vendor/VendorSettings"));
const VendorNotifications = lazy(() => import("@/pages/vendor/VendorNotifications"));
const AfterVerification = lazy(() => import("@/pages/vendor/AfterVerification"));
const DocumentUpload = lazy(() => import("@/pages/vendor/DocumentUpload"));


/** `/vendor` entry — onboarding redirect only (no dashboard shell). */
export const vendorEntryRoute: RouteObject = {
  path: "/vendor",
  element: (
    <RoleGate allow="vendor" fallback="/unauthorized">
      {suspensePage(VendorDashboardWrapper)}
    </RoleGate>
  ),
};

/** Authenticated `vendor` role area (vendor shell + nested vendor pages). */
export const vendorRoutes: RouteObject = {
  element: (
    <RoleGate allow="vendor" fallback="/unauthorized">
      <VendorLayout />
    </RoleGate>
  ),
  children: [
    { path: "/vendor/dashboard", element: vendorSuspensePage(VendorProfile) },
    { path: "/vendor/profile", element: vendorSuspensePage(VendorProfile) },
    { path: "/vendor/leads", element: vendorSuspensePage(VendorLeads) },
    { path: "/vendor/notifications", element: vendorSuspensePage(VendorNotifications) },
    { path: "/vendor/verification", element: vendorSuspensePage(VendorVerification) },
    { path: "/vendor/boost", element: vendorSuspensePage(VendorBoost) },
    { path: "/vendor/boost/configure", element: vendorSuspensePage(VendorBoostConfigure) },
    { path: "/vendor/review-pay", element: vendorSuspensePage(VendorBoostReviewPay) },
    {
      path: "/vendor/subscription/pay",
      element: <Navigate to="/vendor/premium-payment" replace />,
    },
    { path: "/vendor/analytics", element: vendorSuspensePage(VendorAnalytics) },
    { path: "/vendor/reviews", element: vendorSuspensePage(VendorReviews) },
    { path: "/vendor/payments/:paymentId", element: vendorSuspensePage(VendorPaymentDetail) },
    { path: "/vendor/payments", element: vendorSuspensePage(VendorPayments) },
    { path: "/vendor/settings", element: vendorSuspensePage(VendorSettings) },
    { path: "/vendor/after-verification", element: vendorSuspensePage(AfterVerification) },
    { path: "/vendor/document-upload", element: vendorSuspensePage(DocumentUpload) },
  ],
};
