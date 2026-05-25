import { GlobalBusinessSearch } from "@/components/search/GlobalBusinessSearch";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function Hero() {
  return (
    <section className="lg:mb-20 mb-8 bg-accent lg:py-20 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <ScrollReveal>
            <h2 className="font-inter lg:text-[56px] text-[32px] font-semibold text-text-primary">
              What are you looking for today?
            </h2>
          </ScrollReveal>
          <ScrollReveal delayMs={90}>
            <p className="mx-auto mt-4 flex max-w-2xl flex-col items-center text-center font-inter text-xl font-normal text-text-secondary">
              Discover trusted businesses and professionals near you.
            </p>
          </ScrollReveal>
        </div>
        <ScrollReveal delayMs={160}>
          <div className="mb-14 mt-10">
            <GlobalBusinessSearch variant="hero" />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
