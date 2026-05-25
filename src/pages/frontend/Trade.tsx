import { LandingHero } from "@/components/sections/landing/LandingHero";
import { LandingWhyVendors } from "@/components/sections/landing/LandingWhyVendors";
import { LandingSteps } from "@/components/sections/landing/LandingSteps";
import { LandingPricing } from "@/components/sections/landing/LandingPricing";
import { LandingTestimonials } from "@/components/sections/landing/LandingTestimonials";
import { LandingCta } from "@/components/sections/landing/LandingCta";

export default function Trade() {
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
