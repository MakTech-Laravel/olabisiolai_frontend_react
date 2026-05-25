import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

import { AuthLayout } from "@/layouts/auth/AuthLayout";
import { GuestGate } from "@/routes/GuestGate";
import { suspensePage } from "@/routes/routeUtils";

const UserType = lazy(() => import("@/pages/frontend/auth/UserType"));
const LoginGoogle = lazy(() => import("@/pages/frontend/auth/LoginGoogle"));
const LoginEmail = lazy(() => import("@/pages/frontend/auth/LoginEmail"));
const LoginTwoFactor = lazy(() => import("@/pages/frontend/auth/LoginTwoFactor"));
const ForgetPassword = lazy(() => import("@/pages/frontend/auth/ForgetPassword"));
const OTPVerification = lazy(() => import("@/pages/frontend/auth/OTPVerification"));
const ResetPassword = lazy(() => import("@/pages/frontend/auth/ResetPassword"));
const Register = lazy(() => import("@/pages/frontend/auth/Register"));
const AdminLogin = lazy(() => import("@/pages/frontend/auth/AdminLogin"));

/** Guest-only auth screens (wrapped with GuestGate). */
export const authRoutes: RouteObject = {
  element: <AuthLayout />,
  children: [
    {
      path: "/user-type",
      element: <GuestGate>{suspensePage(UserType)}</GuestGate>,
    },
    {
      path: "/login",
      element: <GuestGate>{suspensePage(UserType)}</GuestGate>,
    },
    {
      path: "/login/google",
      element: <GuestGate>{suspensePage(LoginGoogle)}</GuestGate>,
    },
    {
      path: "/login/email",
      element: <GuestGate>{suspensePage(LoginEmail)}</GuestGate>,
    },
    {
      path: "/login/two-factor",
      element: <GuestGate>{suspensePage(LoginTwoFactor)}</GuestGate>,
    },
    {
      path: "/forget-password",
      element: <GuestGate>{suspensePage(ForgetPassword)}</GuestGate>,
    },
    {
      path: "/otp-verification",
      element: <GuestGate>{suspensePage(OTPVerification)}</GuestGate>,
    },
    {
      path: "/reset-password",
      element: <GuestGate>{suspensePage(ResetPassword)}</GuestGate>,
    },
    {
      path: "/register",
      element: <GuestGate>{suspensePage(Register)}</GuestGate>,
    },
    {
      path: "/admin/login",
      element: <GuestGate>{suspensePage(AdminLogin)}</GuestGate>,
    },
  ],
};
