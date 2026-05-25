import { Store, Shield, BarChart3, Zap, MessageCircle, Star } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { container } from "@/lib/container";

const whyFeatures = [
  {
    title: "Millions of Customers",
    body: "Get discovered by active buyers searching for exactly the services you offer across Nigeria.",
    icon: Store,
    tone: "red" as const,
  },
  {
    title: "Verified Trust Badge",
    body: "Build credibility with a verification badge that tells customers your business is legitimate and trustworthy.",
    icon: Shield,
    tone: "blue" as const,
  },
  {
    title: "Business Analytics",
    body: "Track profile views, enquiries, and customer engagement with real-time performance dashboards.",
    icon: BarChart3,
    tone: "blue" as const,
  },
  {
    title: "Boost Visibility",
    body: "Appear at the top of search results with boost packages. Get up to 10x more views than standard listings.",
    icon: Zap,
    tone: "red" as const,
  },
  {
    title: "Direct Messages",
    body: "Receive enquiries directly from interested customers. No middleman, no commission on your deals.",
    icon: MessageCircle,
    tone: "blue" as const,
  },
  {
    title: "Customer Reviews",
    body: "Collect and showcase reviews from satisfied customers. Higher-rated businesses get more enquiries.",
    icon: Star,
    tone: "blue" as const,
  },
] as const;

export function LandingWhyVendors() {
  return (
    <section className="bg-surface-wash px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className={container}>
        <ScrollReveal className="mb-12 text-center md:mb-16">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl sm:leading-9">
            Why Vendors Choose Gidira
          </h2>
          <p className="mt-4 text-base text-ink-muted">
            Everything you need to grow your business and reach customers who
            are ready to buy.
          </p>
        </ScrollReveal>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {whyFeatures.map((f, i) => (
            <ScrollReveal key={f.title} delayMs={i * 90}>
              <div className="h-full rounded-2xl border border-border-light bg-white p-8 shadow-sm">
                <div
                  className={
                    f.tone === "red"
                      ? "mb-4 flex size-12 items-center justify-center rounded-lg bg-tint-red text-brand-red"
                      : "mb-4 flex size-12 items-center justify-center rounded-lg bg-surface-soft text-brand"
                  }
                >
                  <f.icon className="size-6" />
                </div>
                <h3 className="text-lg font-semibold text-ink-heading">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {f.body}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
