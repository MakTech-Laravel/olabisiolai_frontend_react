import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useVendorSubscriptionAccess } from "@/hooks/useVendorSubscriptionAccess";

import { PlanFeatureCheck, PlanFeatureLocked } from "./PlanFeature";

export function PlanPricingCards() {
  const navigate = useNavigate();
  const { goToPremiumPayment } = useVendorSubscriptionAccess();

  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-8">
      <Card className="overflow-hidden border-border-light bg-card text-card-foreground shadow-sm">
        <CardContent className="space-y-6 p-8">
          <div>
            <h2 className="text-2xl font-bold font-manrope">Basic</h2>
            <p className="mt-3 text-4xl font-bold tracking-tight font-manrope">
              Free
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
            onClick={() => {
              localStorage.setItem("vendorPlan", "free"); // ✅ save plan
              navigate("/vendor/plan-form");
            }}
          >
            Get started free
          </Button>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-2 border-brand-red/40 bg-card text-card-foreground shadow-sm">
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-b-lg bg-brand-red px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white">
          Most popular
        </div>
        <CardContent className="space-y-6 p-8 pt-12">
          <div>
            <h2 className="text-2xl font-bold font-manrope">Premium</h2>
            <p className="mt-3 text-4xl font-bold tracking-tight font-manrope">
              ₦25,000
              <span className="text-lg font-semibold text-muted-foreground">
                {" "}
                / year
              </span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground font-inter">
              For serious vendors who want to grow fast.
            </p>
          </div>
          <ul className="space-y-3">
            <PlanFeatureCheck>Everything in Basic</PlanFeatureCheck>
            <PlanFeatureCheck>Up to 20 photos</PlanFeatureCheck>
            <PlanFeatureCheck>Full analytics dashboard</PlanFeatureCheck>
            <PlanFeatureLocked>Verified badge (separate verification fee)</PlanFeatureLocked>
            <PlanFeatureCheck>Priority boost access</PlanFeatureCheck>
            <PlanFeatureCheck>Featured in search results</PlanFeatureCheck>
          </ul>
          <Button
            type="button"
            className="w-full bg-brand-red py-6 text-base font-inter font-semibold text-white shadow-sm hover:bg-brand-red/90"
            onClick={() => {
              localStorage.setItem("vendorPlan", "premium");
              goToPremiumPayment();
            }}
          >
            Start premium
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
