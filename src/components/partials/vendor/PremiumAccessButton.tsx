import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { useVendorSubscriptionAccess } from "@/hooks/useVendorSubscriptionAccess";
import { cn } from "@/lib/utils";

type PremiumAccessButtonProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  /** When true, navigates to boost if already premium; otherwise subscription checkout. */
  boostWhenPremium?: boolean;
  onBeforeNavigate?: () => void;
};

export function PremiumAccessButton({
  boostWhenPremium = false,
  onBeforeNavigate,
  className,
  children,
  type = "button",
  ...props
}: PremiumAccessButtonProps) {
  const { goToPremiumPayment, goToBoost, isPremiumActive, showPremiumUpgradeCta } =
    useVendorSubscriptionAccess();

  if (!showPremiumUpgradeCta && !boostWhenPremium) {
    return null;
  }

  const handleClick = () => {
    onBeforeNavigate?.();
    if (boostWhenPremium && isPremiumActive) {
      goToBoost();
      return;
    }
    goToPremiumPayment();
  };

  return (
    <Button type={type} className={cn(className)} onClick={handleClick} {...props}>
      {children}
    </Button>
  );
}
