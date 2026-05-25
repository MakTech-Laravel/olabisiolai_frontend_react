import { Category } from "@/components/sections/home/Category";
import { Hero } from "@/components/sections/home/Hero";
import Featured from "@/components/sections/home/Featured";
import HowGidiraWorks from "@/components/sections/home/HowGidiraWorks";
import WhyChooseGidira from "@/components/sections/home/WhyChooseGidira";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export default function Home() {
  return (
    <div className="min-h-dvh">
      <Hero />
      <ScrollReveal delayMs={60}>
        <Category />
      </ScrollReveal>
      <ScrollReveal delayMs={60}>
        <Featured />
      </ScrollReveal>
      <ScrollReveal delayMs={60}>
        <HowGidiraWorks />
      </ScrollReveal>
      <ScrollReveal delayMs={60}>
        <WhyChooseGidira />
      </ScrollReveal>
    </div>
  );
}
