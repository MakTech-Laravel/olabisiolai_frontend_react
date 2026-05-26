import { useEffect } from "react";

import { LandingHero } from "@/components/sections/landing/LandingHero";
import { LandingWhyVendors } from "@/components/sections/landing/LandingWhyVendors";
import { LandingSteps } from "@/components/sections/landing/LandingSteps";
import { LandingPricing } from "@/components/sections/landing/LandingPricing";
import { LandingTestimonials } from "@/components/sections/landing/LandingTestimonials";
import { LandingCta } from "@/components/sections/landing/LandingCta";
import {
  TRADE_CHOOSE_PLAN_SECTION_ID,
  scrollToTradeChoosePlan,
} from "@/lib/tradeLanding";

export default function Trade() {
  useEffect(() => {
    if (window.location.hash !== `#${TRADE_CHOOSE_PLAN_SECTION_ID}`) return;
    const timer = window.setTimeout(() => scrollToTradeChoosePlan(), 120);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-dvh bg-white font-sans text-ink">
      <LandingHero />
      <LandingWhyVendors />
      <LandingSteps />
      <LandingPricing />
      <LandingTestimonials />
      <LandingCta />
    </div>
  );
}
