import { Star } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { container } from "@/lib/container";

const testimonials = [
  {
    quote:
      '"Since listing on Gidira, my plumbing business gets 3-4 new enquiries every day. The verified badge really helps customers trust me."',
    initials: "CK",
    name: "Chidi Kalu",
    role: "Plumbing King, Lagos",
    avatarClass: "bg-avatar-a",
  },
  {
    quote:
      '"I went from zero online presence to fully booked weekends in just two months. The analytics help me understand what customers are looking for."',
    initials: "FO",
    name: "Folake Ogundimu",
    role: "Folake's Kitchen, Abuja",
    avatarClass: "bg-avatar-b",
  },
  {
    quote:
      "\"Best ₦25,000 I've ever spent. Premium gave my salon a 5x visibility boost. Customers now find me before my competitors.\"",
    initials: "AN",
    name: "Amina Nwankwo",
    role: "Glow Beauty Salon, Port Harcourt",
    avatarClass: "bg-avatar-c",
  },
] as const;

export function LandingTestimonials() {
  return (
    <section className="bg-surface-soft px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className={container}>
        <ScrollReveal className="mb-12 text-center md:mb-16">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl sm:leading-9">
            Vendors Love Gidira
          </h2>
          <p className="mt-4 text-base text-ink-muted">
            Real businesses, real results. Here&apos;s what our vendors have
            to say.
          </p>
        </ScrollReveal>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <ScrollReveal key={t.name} delayMs={i * 100}>
              <article className="h-full rounded-2xl border border-white/10 bg-card-ice p-8 shadow-sm">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className="size-4 fill-amber-400 text-amber-400"
                      aria-hidden
                    />
                  ))}
                </div>
                <p className="mt-4 text-sm italic leading-relaxed text-quote-muted">
                  {t.quote}
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${t.avatarClass}`}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{t.name}</p>
                    <p className="text-xs text-placeholder-text">{t.role}</p>
                  </div>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
