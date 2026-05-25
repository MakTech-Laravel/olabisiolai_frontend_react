import {
  GraduationCap,
  Home,
  MapPin,
  Target,
  TrendingUp,
  Users,
  Wallet,
  ChevronDown,
} from "lucide-react";

import { container } from "@/lib/container";
import { alert } from "@/lib/sweetAlert";
import { cn } from "@/lib/utils";

const HR_EMAIL = "hr@gidira.com";

function applicationMailto(jobTitle: string): string {
  const subject = `Application: ${jobTitle}`;
  return `mailto:${HR_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

async function handleApplyNow(jobTitle: string): Promise<void> {
  const subject = `Application: ${jobTitle}`;
  const confirmed = await alert.confirm({
    title: "Apply for this role",
    html: `<p class="text-sm">Your email app will open to <strong>${HR_EMAIL}</strong> with the subject line:</p><p class="mt-2 text-sm font-semibold">${subject}</p><p class="mt-3 text-sm text-body-secondary">Attach your CV and a short cover letter, then send the email.</p>`,
    icon: "info",
    confirmText: "Open email",
    cancelText: "Cancel",
  });
  if (confirmed) {
    window.location.href = applicationMailto(jobTitle);
  }
}

/** Served from `public/images/careers/` — do not use temporary Figma MCP URLs. */
const MISSION_IMAGE = "/images/careers/mission-vision.jpg";

const PERK_CARDS = [
  {
    icon: Home,
    title: "Remote-Friendly",
    body: "Work from anywhere in Nigeria with flexible arrangements that fit your lifestyle.",
  },
  {
    icon: Wallet,
    title: "Competitive Pay",
    body: "Industry-leading salaries and benefits packages to match your expertise.",
  },
  {
    icon: TrendingUp,
    title: "Growth Opportunities",
    body: "Advance your career with clear paths, mentorship, and leadership development.",
  },
  {
    icon: Target,
    title: "Impact-Driven",
    body: "Make a real difference in Nigeria's digital transformation and economic growth.",
  },
  {
    icon: Users,
    title: "Inclusive Culture",
    body: "We celebrate diversity and foster an environment where everyone belongs.",
  },
  {
    icon: GraduationCap,
    title: "Learning & Development",
    body: "Access courses, conferences, and training to continuously develop your skills.",
  },
] as const;

const OPEN_ROLES = [
  {
    title: "Full-stack Developer",
    dept: "Engineering",
    location: "Lagos / Remote",
  },
  {
    title: "Product Designer",
    dept: "Design",
    location: "Lagos",
  },
  {
    title: "Business Development Manager",
    dept: "Sales",
    location: "Lagos / Abuja",
  },
  {
    title: "Customer Success Lead",
    dept: "Support",
    location: "Remote",
  },
  {
    title: "Marketing Coordinator",
    dept: "Marketing",
    location: "Lagos",
  },
] as const;

function scrollToOpenPositions() {
  document.getElementById("open-positions")?.scrollIntoView({ behavior: "smooth" });
}

export default function Careers() {
  return (
    <div className="w-full bg-muted">
      <div className={cn(container, "flex flex-col gap-0 py-10 sm:py-12")}>
        <section
          className={cn(
            "relative w-full overflow-hidden rounded-xl bg-gradient-to-b from-brand to-blue-600 px-6 py-12 sm:px-10 sm:py-14",
          )}
        >
          <div
            className="pointer-events-none absolute -right-24 -top-32 size-72 rounded-full bg-white/10 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-24 size-72 rounded-full bg-white/10 blur-3xl"
            aria-hidden
          />
          <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
            <h1 className=" font-extrabold tracking-tight text-ice text-3xl md:text-6xl lg:text-7xl lg:leading-[1.05]">
              Join the Gidira Team
            </h1>
            <p className="max-w-xl text-lg leading-7 text-ice sm:text-xl">
              Help us build Nigeria&apos;s premier digital economy platform,
              connecting millions of businesses with customers every day.
            </p>
            <button
              type="button"
              onClick={scrollToOpenPositions}
              className="inline-flex items-center gap-2 rounded bg-brand-red px-8 py-4 text-base font-bold text-ice transition-opacity hover:opacity-90"
            >
              View Open Positions
              <ChevronDown className="size-4" aria-hidden />
            </button>
          </div>
        </section>
      </div>

      <section className="w-full bg-muted lg:py-20 py-12">
        <div className={cn(container, "flex flex-col gap-12 sm:gap-16")}>
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">
              Careers at Gidira
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-foreground lg:text-4xl">
              Why Work at Gidira
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PERK_CARDS.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex flex-col gap-3 rounded bg-card p-8 shadow-sm"
              >
                <div className="flex size-12 items-center justify-center rounded bg-tint-red">
                  <Icon className="size-5 text-brand-red" strokeWidth={2} aria-hidden />
                </div>
                <h3 className="pt-3 text-xl font-bold text-foreground">{title}</h3>
                <p className="text-base leading-relaxed text-body-secondary">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-background py-20 sm:py-24">
        <div className={cn(container, "grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16")}>
          <div className="relative aspect-[4/5] max-h-[400px] w-full overflow-hidden rounded shadow-lg lg:max-h-none">
            <img
              src={MISSION_IMAGE}
              alt="Gidira's vision for Nigeria"
              className="absolute inset-0 size-full object-cover object-center"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="flex flex-col gap-8">
            <h2 className="text-1xl font-bold tracking-tight text-foreground lg:text-4xl">
              Our Mission
            </h2>
            <div className="flex flex-col gap-6 text-lg leading-relaxed text-body-secondary">
              <p>
                At Gidira, we are committed to empowering Nigerian businesses and
                entrepreneurs by providing the digital infrastructure needed to
                thrive in a global economy. Our mission is to bridge the gap
                between innovation and accessibility, ensuring that every local
                merchant has the tools to reach millions of customers.
              </p>
              <p>
                We believe that technology should be an equalizer. By building
                high-performance, secure, and intuitive platforms, we are not just
                facilitating transactions; we are catalyzing economic
                transformation across all 36 states of Nigeria.
              </p>
            </div>
            <blockquote className="border-l-4 border-brand-red pl-7 pt-4 text-lg font-medium italic leading-relaxed text-foreground">
              &quot;Our goal is to be the pulse of Nigeria&apos;s digital future,
              one connection at a time.&quot;
            </blockquote>
          </div>
        </div>
      </section>

      <section
        id="open-positions"
        className="w-full scroll-mt-24 bg-surface-soft py-20 sm:py-24"
      >
        <div className={cn(container, "mx-auto flex max-w-4xl flex-col gap-10")}>
          <div className="flex flex-col gap-4 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground lg:text-4xl">
              Open Positions
            </h2>
            <p className="text-base text-body-secondary">
              Join us in shaping the future of Nigerian digital commerce.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {OPEN_ROLES.map((job) => (
              <div
                key={job.title}
                className="flex flex-col gap-4 rounded bg-card-ice p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold text-foreground">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded bg-muted px-3 py-1 text-xs font-bold uppercase tracking-wide text-body-secondary">
                      {job.dept}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-body-secondary">
                      <MapPin className="size-3.5 shrink-0" aria-hidden />
                      {job.location}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleApplyNow(job.title)}
                  className="inline-flex shrink-0 items-center justify-center rounded bg-brand-red px-6 py-3 text-sm font-bold text-ice transition-opacity hover:opacity-90"
                >
                  Apply Now
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-2 rounded border-2 border-dashed border-brand-red/35 bg-muted px-8 py-12 text-center sm:px-12">
            <h3 className="text-2xl font-bold text-foreground">
              Don&apos;t see your role?
            </h3>
            <p className="max-w-xl text-base leading-6 text-body-secondary">
              We&apos;re always looking for talented individuals. If you don&apos;t
              see a position that fits, we&apos;d still love to hear from you.
            </p>
            <button
              type="button"
              onClick={() => void handleApplyNow("General inquiry")}
              className="pt-2 text-base font-semibold text-brand-red hover:underline"
            >
              hr@gidira.com
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}