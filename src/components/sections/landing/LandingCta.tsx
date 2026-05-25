import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { container } from "@/lib/container";

export function LandingCta() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div
        className={`${container} flex max-w-3xl flex-col items-center gap-6 text-center`}
      >
        <ScrollReveal>
          <h2 className="lg:text-3xl text-2xl font-bold text-ink sm:text-4xl sm:leading-10">
            Ready to Grow Your Business?
          </h2>
        </ScrollReveal>
        <ScrollReveal delayMs={90}>
          <p className="text-lg text-ink-muted">
            Join thousands of Nigerian vendors already trading on Gidira. Your
            first listing is completely free.
          </p>
        </ScrollReveal>
        <ScrollReveal delayMs={160}>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-10 py-4 text-base font-medium text-ice"
          >
            <Plus className="size-5" />
            Create Your Business Profile
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
