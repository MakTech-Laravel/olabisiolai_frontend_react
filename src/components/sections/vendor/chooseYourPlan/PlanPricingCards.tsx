import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { switchToVendorMode } from "@/api/userMode";
import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { businessProfilePath } from "@/lib/businessProfile";
import { formatMoney } from "@/lib/currency";
import { ensureCanStartVendorSignup } from "@/features/vendor/vendorSignupFromCustomerGuard";
import {
  saveVendorPlan,
  vendorRegisterPath,
  type VendorPlanChoice,
} from "@/features/vendor/vendorPlanStorage";
import { fetchPublicSubscriptionPackages } from "@/features/subscription/vendorSubscriptionApi";
import { useVendorSubscriptionAccess } from "@/hooks/useVendorSubscriptionAccess";

import { PlanFeatureCheck, PlanFeatureLocked } from "./PlanFeature";

type PlanPricingCardsProps = {
  signupMode?: boolean;
};

const BILLING_PERIOD_SUFFIX: Record<string, string> = {
  monthly: "/ month",
  quarterly: "/ quarter",
  yearly: "/ year",
  lifetime: "",
};

export function PlanPricingCards({ signupMode = false }: PlanPricingCardsProps) {
  const navigate = useNavigate();
  const { user, logout, setUser, refreshSession } = useAuth();
  const { goToPremiumPayment } = useVendorSubscriptionAccess();

  const packagesQuery = useQuery({
    queryKey: ["public", "subscription-packages"],
    queryFn: fetchPublicSubscriptionPackages,
    staleTime: 60_000,
  });

  const packages = packagesQuery.data?.packages ?? [];
  const premiumPlan = packages.find((p) => p.is_recommended) ?? packages[0];
  const premiumPerks = premiumPlan?.perks?.length
    ? premiumPlan.perks
    : [
      "Everything in Free",
      "Full analytics dashboard",
      "Priority boost access",
      "Featured in search results",
    ];
  const billingSuffix = premiumPlan?.billing_period
    ? (BILLING_PERIOD_SUFFIX[premiumPlan.billing_period] ?? "")
    : "/ year";

  const startSignupWithPlan = (plan: VendorPlanChoice) => {
    saveVendorPlan(plan);
    navigate(vendorRegisterPath(plan));
  };

  const handleFreePlan = async () => {
    if (signupMode && !user) {
      startSignupWithPlan("free");
      return;
    }

    if (!(await ensureCanStartVendorSignup(user, logout))) return;
    saveVendorPlan("free");

    const result = await switchToVendorMode();
    setUser(result.user);
    await refreshSession();

    if (result.business_id) {
      navigate(businessProfilePath(result.business_id));
      return;
    }

    navigate("/user/profile");
  };

  const handlePremiumPlan = async () => {
    if (signupMode && !user) {
      startSignupWithPlan("premium");
      return;
    }

    if (!(await ensureCanStartVendorSignup(user, logout))) return;
    saveVendorPlan("premium");
    goToPremiumPayment();
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-8">
      <Card className="overflow-hidden border-border-light bg-card text-card-foreground shadow-sm">
        <CardContent className="space-y-6 p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Free plan
            </p>
            <h2 className="text-2xl font-bold font-manrope">Free</h2>
            <p className="mt-3 text-4xl font-bold tracking-tight font-manrope">
              ₦0
            </p>
            <p className="mt-2 text-sm text-muted-foreground font-inter">
              Perfect for getting started on Gidira.
            </p>
          </div>
          <ul className="space-y-3">
            <PlanFeatureCheck>Business profile listing</PlanFeatureCheck>
            <PlanFeatureCheck>Up to 5 photos</PlanFeatureCheck>
            <PlanFeatureCheck>Direct customer messages</PlanFeatureCheck>
            <PlanFeatureCheck>WhatsApp integration</PlanFeatureCheck>
            <PlanFeatureLocked>Basic analytics only</PlanFeatureLocked>
            <PlanFeatureLocked>No boost access</PlanFeatureLocked>
          </ul>
          <Button
            type="button"
            variant="outline"
            className="w-full border-border py-6 text-base font-inter font-semibold hover:bg-muted/50"
            onClick={() => void handleFreePlan()}
          >
            {signupMode ? "Continue with Free" : "Get started free"}
          </Button>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-2 border-brand-red/40 bg-card text-card-foreground shadow-sm">
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-b-lg bg-brand-red px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white">
          Most popular
        </div>
        <CardContent className="space-y-6 p-8 pt-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-red">
              Premium plan
            </p>
            <h2 className="text-2xl font-bold font-manrope">{premiumPlan?.title ?? "Premium"}</h2>
            <p className="mt-3 text-4xl font-bold tracking-tight font-manrope">
              {formatMoney(premiumPlan?.amount ?? 0, packagesQuery.data?.currency)}
              {billingSuffix ? (
                <span className="text-lg font-semibold text-muted-foreground"> {billingSuffix}</span>
              ) : null}
            </p>
            {premiumPlan?.original_price ? (
              <p className="mt-1 text-sm text-muted-foreground line-through">
                {formatMoney(premiumPlan.original_price, packagesQuery.data?.currency)}
              </p>
            ) : null}
            {premiumPlan?.promotional_text ? (
              <p className="mt-1 text-sm font-semibold text-brand-red">{premiumPlan.promotional_text}</p>
            ) : null}
            <p className="mt-2 text-sm text-muted-foreground font-inter">
              {premiumPlan?.description || "For serious vendors who want to grow fast."}
            </p>
          </div>
          <ul className="space-y-3">
            {premiumPerks.map((perk) => (
              <PlanFeatureCheck key={perk}>{perk}</PlanFeatureCheck>
            ))}
            <PlanFeatureLocked>Verified badge (separate verification fee)</PlanFeatureLocked>
          </ul>
          <Button
            type="button"
            className="w-full bg-brand-red py-6 text-base font-inter font-semibold text-white shadow-sm hover:bg-brand-red/90"
            onClick={() => void handlePremiumPlan()}
          >
            {signupMode ? "Continue with Premium" : "Start premium"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
