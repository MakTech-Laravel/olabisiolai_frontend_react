import * as React from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/useAuth";
import {
  handleVendorOnboardingCta,
  type VendorOnboardingGuestDestination,
  type VendorOnboardingVendorDestination,
} from "@/features/vendor/vendorOnboardingCta";
import { cn } from "@/lib/utils";

type VendorOnboardingCtaButtonProps = {
  children: React.ReactNode;
  className?: string;
  guestDestination?: VendorOnboardingGuestDestination;
  vendorDestination?: VendorOnboardingVendorDestination;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type">;

/**
 * Replaces `/login` links on marketing pages so customers are not sent to the user dashboard.
 */
export function VendorOnboardingCtaButton({
  children,
  className,
  guestDestination,
  vendorDestination = "dashboard",
  disabled,
  ...rest
}: VendorOnboardingCtaButtonProps) {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isSessionLoading, isUserLoading } = useAuth();
  const authReady = !isSessionLoading && !isUserLoading;

  const onClick = () => {
    if (!authReady) return;
    void handleVendorOnboardingCta({
      user,
      logout,
      isAuthenticated,
      navigate,
      guestDestination,
      vendorDestination,
    });
  };

  return (
    <button
      type="button"
      disabled={disabled ?? !authReady}
      onClick={onClick}
      className={cn(
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
