import { lazy } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";

import { ScrollToTopLayout, suspensePage } from "@/routes/routeUtils";
import { publicRoutes } from "@/routes/publicRoutes";
import { authRoutes } from "@/routes/authRoutes";
import { userRoutes } from "@/routes/userRoutes";
import { vendorEntryRoute, vendorRoutes } from "@/routes/vendorRoutes";
import { adminRoutes } from "@/routes/adminRoutes";

const Unauthorized = lazy(() => import("@/pages/frontend/Unauthorized"));
const NotFound = lazy(() => import("@/pages/frontend/NotFound"));

export const router = createBrowserRouter([
  {
    element: <ScrollToTopLayout />,
    children: [
      publicRoutes,
      authRoutes,
      { path: "/unauthorized", element: suspensePage(Unauthorized) },
      { path: "/dashboard", element: <Navigate to="/user/dashboard" replace /> },
      userRoutes,
      vendorEntryRoute,
      vendorRoutes,
      adminRoutes,
      { path: "*", element: suspensePage(NotFound) },
    ],
  },
]);
