import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { container } from "@/lib/container";

const steps = [
  {
    n: 1,
    title: "Create Your Account",
    desc: "Sign up with your email or phone number. Quick and simple registration.",
  },
  {
    n: 2,
    title: "Choose a Plan",
    desc: "Start free with Basic or go Premium for analytics, more photos, and priority placement.",
  },
  {
    n: 3,
    title: "Set Up Your Profile",
    desc: "Add your business name, services, photos, and contact details in our guided form.",
  },
  {
    n: 4,
    title: "Start Getting Customers",
    desc: "Your business goes live. Customers find you through search and start reaching out.",
  },
] as const;

export function LandingSteps() {
  return (
    <section className="bg-surface-soft px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className={container}>
        <ScrollReveal className="mb-12 text-center md:mb-16">
          <h2 className="text-2xl font-bold text-ink-heading sm:text-3xl sm:leading-9">
            Get Listed in 4 Simple Steps
          </h2>
          <p className="mt-4 text-base text-ink-muted">
            From signup to your first customer — it takes less than 10 minutes.
          </p>
        </ScrollReveal>

        <div className="relative">
          <div className="absolute left-0 right-0 top-6 hidden h-0.5 bg-step-line md:block" />
          <div className="grid gap-10 md:grid-cols-4 md:gap-8">
            {steps.map((step, i) => (
              <ScrollReveal
                key={step.n}
                delayMs={i * 100}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative z-10 flex size-12 items-center justify-center rounded-full bg-step-badge text-xl font-bold text-white">
                  {step.n}
                </div>
                <h3 className="mt-4 text-base font-semibold text-ink-heading">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-xs text-xs leading-4 text-ink-muted">
                  {step.desc}
                </p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
