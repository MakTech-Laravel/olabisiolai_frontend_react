import { PremiumAccessButton } from "@/components/partials/vendor/PremiumAccessButton";
import { cn } from "@/lib/utils";

const paleSurface = "bg-[#EEF2FF]";

export function PlanFooterCta() {
  return (
    <div className={cn("rounded-2xl px-6 py-12 text-center md:px-12", paleSurface)}>
      <h2 className="text-2xl font-bold text-foreground font-manrope md:text-3xl">Ready to grow your business?</h2>
      <p className="mx-auto mt-3 max-w-lg text-muted-foreground font-inter">
        Stop missing out on potential customers. Join our elite circle of vendors today.
      </p>
      <PremiumAccessButton className="mt-8 bg-brand-red px-10 py-6 text-base font-inter font-semibold text-white hover:bg-brand-red/90">
        Upgrade to premium
      </PremiumAccessButton>
    </div>
  );
}
