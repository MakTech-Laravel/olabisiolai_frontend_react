import { Link } from "react-router-dom";
import { Plus, Play } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { container } from "@/lib/container";

const stats = [
  { n: "12,400+", l: "Active Vendors" },
  { n: "2.1M", l: "Monthly Searches" },
  { n: "98%", l: "Satisfaction Rate" },
  { n: "36", l: "States Covered" },
] as const;

export function LandingHero() {
  return (
    <section className="bg-landing-hero px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8 lg:pb-24 lg:pt-24">
      <div
        className={`${container} flex max-w-4xl flex-col items-center gap-6 text-center`}
      >
        <ScrollReveal>
          <div className="rounded-full bg-white/10 px-4 py-1.5">
            <p className="text-xs font-medium text-ice sm:text-sm">
              ✨ Join 12,000+ vendors already on Gidira
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delayMs={80}>
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-ice sm:text-4xl md:text-5xl lg:text-6xl lg:leading-[60px]">
            <span className="block sm:inline">Turn Your Skills Into a </span>
            <span className="text-brand">Thriving</span>
            <span className="block text-brand">Business</span>
          </h1>
        </ScrollReveal>

        <ScrollReveal delayMs={140}>
          <p className="max-w-2xl text-base leading-7 text-surface-soft sm:text-lg">
            List your business on Nigeria&apos;s fastest-growing marketplace.
            Connect with millions of customers actively searching for your
            services.
          </p>
        </ScrollReveal>

        <ScrollReveal delayMs={200}>
          <div className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:justify-center">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-8 py-4 text-base font-medium text-ice"
          >
            <Plus className="size-5 shrink-0" />
            Start Trading Now
          </Link>
          <a
            href="https://www.youtube.com/@Gidira"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-8 py-4 text-base font-medium text-white backdrop-blur-sm"
          >
            <Play className="size-5 shrink-0 fill-white text-white" />
            See How It Works
          </a>
        </div>
        </ScrollReveal>

        <ScrollReveal delayMs={260} className="mt-8 w-full max-w-4xl">
          <div className="grid w-full grid-cols-2 gap-6 border-t border-white/10 pt-10 md:grid-cols-4 md:gap-8">
            {stats.map((s, i) => (
              <ScrollReveal key={s.l} delayMs={i * 70} className="text-center">
                <p className="text-2xl font-semibold text-ice sm:text-3xl sm:leading-9">
                  {s.n}
                </p>
                <p className="mt-1 text-sm text-stat-muted">{s.l}</p>
              </ScrollReveal>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
