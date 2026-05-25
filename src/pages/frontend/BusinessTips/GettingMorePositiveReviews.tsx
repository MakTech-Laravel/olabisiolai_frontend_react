import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Handshake,
  Heart,
  Sparkles,
  Star,
  UserRound,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { container } from "@/lib/container";
import { cn } from "@/lib/utils";

/** Assets from Figma node 591:5611 — olabisiolai--Copy- */
const TEAM_IMAGE = "/images/business-tips/getting-more-reviews-team.jpg";
const CUSTOMER_IMAGE = "/images/business-tips/getting-more-reviews-customer.jpg";
const AVATAR_1 = "/images/business-tips/getting-more-reviews-avatar-1.jpg";
const AVATAR_2 = "/images/business-tips/getting-more-reviews-avatar-2.jpg";

const MESSAGE_TEMPLATE = `"Hi [Customer Name]! It was a pleasure serving you today at [Business Name].
We'd love to hear your feedback—could you take 30 seconds to leave us a
review on Gidira? It really helps our small business grow! Link:
[YourLink]"`;

const PRINCIPLES = [
  {
    icon: Zap,
    title: "Exceed Expectations",
    body: (
      <>
        Under-promise and over-deliver
        <br />
        to create a &apos;wow&apos; moment.
      </>
    ),
  },
  {
    icon: Handshake,
    title: "Be Professional",
    body: (
      <>
        Politeness and respect are the
        <br />
        bare minimum for excellence.
      </>
    ),
  },
  {
    icon: Heart,
    title: "Personal Touches",
    body: (
      <>
        Remember names or specific
        <br />
        preferences to build a real bond.
      </>
    ),
  },
  {
    icon: Sparkles,
    title: "Consistency",
    body: (
      <>
        Ensure every customer gets the
        <br />
        same premium experience.
      </>
    ),
  },
] as const;

const NEGATIVE_STEPS = [
  {
    n: 1,
    title: "Stay Calm",
    body: (
      <>
        Never respond in anger. Take 10 minutes to
        <br />
        cool off before typing.
      </>
    ),
  },
  {
    n: 2,
    title: "Respond Professionally",
    body: (
      <>
        Acknowledge the issue publicly so others
        <br />
        see you care.
      </>
    ),
  },
  {
    n: 3,
    title: "Offer Solutions",
    body: (
      <>
        Invite them to a private chat or offer a
        <br />
        refund/redo.
      </>
    ),
  },
  {
    n: 4,
    title: "Turn Positives",
    body: (
      <>
        Fix the root cause to ensure it never
        <br />
        happens again.
      </>
    ),
  },
] as const;

const CHECKLIST = [
  {
    title: "Service Excellence First",
    desc: "Review generation only works if the core product is solid.",
  },
  {
    title: "Perfect the Timing",
    desc: 'Ask during the "Happiness Peak" of the transaction.',
  },
  {
    title: "Use WhatsApp",
    desc: "Leverage Nigeria's most active platform for highest conversion.",
  },
  {
    title: "Respond to Everyone",
    desc: "Show that you are a listening and caring business owner.",
  },
] as const;

export default function GettingMorePositiveReviews() {
  const [copied, setCopied] = useState(false);
  const [checklistDone, setChecklistDone] = useState<Record<string, boolean>>({});

  async function handleCopyTemplate() {
    try {
      await navigator.clipboard.writeText(MESSAGE_TEMPLATE.replace(/\n/g, " "));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="w-full bg-background">
      {/* Hero — matches Figma dark band + green glow */}
      <section className="relative overflow-hidden bg-gray-900 py-14 text-center sm:py-20 lg:py-28">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(ellipse 120% 80% at 100% 100%, rgb(0 109 54) 0%, transparent 55%)",
          }}
        />
        <div className={cn(container, "relative z-10 flex flex-col items-center")}>
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-lg bg-green-glow">
            <Star className="h-9 w-9 fill-primary text-primary" aria-hidden />
          </div>
          <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-6xl lg:leading-[1.1]">
            Getting More Positive Reviews
          </h1>
          <p className="mt-6 max-w-3xl text-base font-medium leading-relaxed text-gray-200 sm:text-lg lg:text-2xl lg:leading-snug">
            Transform your customer feedback into a powerful growth engine for
            <br className="hidden sm:block" />
            your business in Nigeria.
          </p>
        </div>
      </section>

      <section className="py-6">
        <div className={cn(container)}>
          <Link
            to="/business-tips"
            className="inline-flex items-center gap-2 text-base font-medium text-gray-800 hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            Back to Business Tips
          </Link>
        </div>
      </section>

      <section className="pb-10 lg:pb-20">
        <div className={cn(container, "flex flex-col gap-12 lg:gap-16")}>
          {/* Why Reviews Matter */}
          <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch lg:gap-12">
            <div className="flex flex-col gap-6 rounded-[24px] bg-gray-50 p-8 sm:p-10 lg:p-12">
              <div className="flex items-center gap-4">
                <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-gray-500">
                  <Star className="h-4 w-4 text-success" aria-hidden />
                </div>
                <h2 className="text-[28px] font-bold leading-tight text-[#191c1e] sm:text-[30px]">
                  Why Reviews Matter
                </h2>
              </div>
              <p className="text-lg leading-relaxed text-gray-500">
                In the digital-first Nigerian market, reviews are your digital handshake. They bridge
                the trust gap and act as social proof that drives new customer acquisition.
              </p>
              <div className="rounded-xl border-l-4 border-success bg-white p-6 shadow-sm sm:p-8">
                <p className="text-base font-medium italic leading-relaxed text-gray-500">
                  &quot;92% of Nigerian consumers read online reviews before making a purchase decision
                  for local services.&quot;
                </p>
                <p className="mt-3 text-sm text-gray-400">— Industry Insight Box</p>
              </div>
            </div>
            <div className="relative min-h-[280px] overflow-hidden rounded-[40px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] lg:min-h-[450px]">
              <img
                src={TEAM_IMAGE}
                alt="Team collaborating on client reviews"
                className="absolute inset-0 size-full object-cover"
                decoding="async"
              />
            </div>
          </div>

          {/* Delivering Review-Worthy Service */}
          <div className="rounded-xl bg-gray-50 px-4 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-20 lg:px-12 lg:pb-24 lg:pt-28">
            <div className="mx-auto flex container flex-col gap-10">
              <div className="flex flex-col gap-4 text-center">
                <h2 className="text-3xl font-bold text-gray-700 sm:text-4xl">
                  Delivering Review-Worthy Service
                </h2>
                <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-700">
                  The foundation of a 5-star review is the experience you provide. Focus on these
                  core principles.
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {PRINCIPLES.map(({ icon: Icon, title, body }) => (
                  <div
                    key={title}
                    className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm sm:p-8"
                  >
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-green-300">
                      <Icon className="size-5 text-gray-950" strokeWidth={2} aria-hidden />
                    </div>
                    <h3 className="pt-2 text-xl font-semibold text-gray-700">{title}</h3>
                    <p className="text-sm leading-5 text-gray-500">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* When to Ask */}
          <div className="overflow-hidden rounded-[40px] bg-gray-900 lg:flex">
            <div className="flex flex-1 flex-col gap-6 p-8 sm:gap-8 sm:p-12 lg:p-16 xl:p-20">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">When to Ask for Reviews</h2>
              <div className="flex flex-col gap-8">
                <div className="flex gap-4">
                  <span className="w-10 shrink-0 text-3xl font-semibold tabular-nums text-green-300">
                    01
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-white">The Happiness Peak</h3>
                    <p className="mt-2 text-base leading-relaxed text-gray-600">
                      The best time is immediately after a successful delivery or service completion
                      when the value is most felt.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="w-10 shrink-0 text-3xl font-semibold tabular-nums text-green-300">
                    02
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Service-Specific Timing</h3>
                    <p className="mt-2 text-base leading-relaxed text-gray-600">
                      For products, wait 3-5 days for them to use it. For services (like a haircut),
                      ask before they leave the premises.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative min-h-[280px] flex-1 lg:min-h-[400px]">
              <img
                src={CUSTOMER_IMAGE}
                alt="Smiling customer using mobile phone"
                className="absolute inset-0 size-full object-cover object-top"
                decoding="async"
              />
            </div>
          </div>

          {/* How to Ask + Message template */}
          <div className="grid gap-8 pt-2 lg:grid-cols-3 lg:gap-10">
            <div className="flex flex-col gap-6 lg:col-span-1">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">How to Ask</h2>
              <div className="flex flex-col gap-4 rounded-2xl bg-gray-100 p-6">
                <div className="flex items-center gap-3">
                  <UserRound className="size-5 shrink-0 text-green-900" aria-hidden />
                  <span className="font-semibold text-gray-900">In Person</span>
                </div>
                <p className="text-sm leading-relaxed text-gray-400">
                  Mention it casually during checkout: &quot;If you enjoyed our service today, we&apos;d love
                  for you to share your experience on Gidira.&quot;
                </p>
              </div>
              <div className="flex flex-col gap-4 rounded-2xl bg-gray-100 p-6">
                <div className="flex items-center gap-3">
                  <Star className="size-5 shrink-0 text-green-900" aria-hidden />
                  <span className="font-semibold text-gray-900">Via WhatsApp</span>
                </div>
                <p className="text-sm leading-relaxed text-gray-400">
                  The most effective channel in Nigeria. Send a direct link shortly after the
                  transaction.
                </p>
              </div>
            </div>
            <div className="flex flex-col lg:col-span-2">
              <div className="flex h-full flex-col gap-8 rounded-[32px] border border-black/5 bg-white p-8 shadow-sm sm:p-10 lg:p-12">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <h3 className="text-2xl font-semibold text-gray-900">Message Template Box</h3>
                  <span className="rounded-full bg-[rgba(0,109,54,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-500">
                    Recommended
                  </span>
                </div>
                <div className="rounded-xl border-2 border-dashed border-gray-50 bg-gray-100 p-6 sm:p-8">
                  <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-600">
                    {MESSAGE_TEMPLATE}
                  </pre>
                </div>
                <div>
                  <Button
                    type="button"
                    onClick={() => void handleCopyTemplate()}
                    className="h-12 rounded-xl bg-green-700 px-6 text-base font-semibold text-white hover:bg-green-500"
                  >
                    <Copy className="mr-2 size-4" aria-hidden />
                    {copied ? "Copied!" : "Copy Template"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Handling Negative Reviews */}
          <div className="flex flex-col gap-8 pt-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">Handling Negative Reviews</h2>
              <p className="mx-auto mt-3 max-w-xl text-base text-grey-600">
                Don&apos;t panic. A handled complaint is an opportunity for loyalty.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {NEGATIVE_STEPS.map(({ n, title, body }) => (
                <div key={n} className="flex flex-col gap-2 rounded-2xl bg-gray-100 p-6">
                  <span className="text-2xl font-semibold text-green-900">{n}</span>
                  <h4 className="font-semibold text-green-900">{title}</h4>
                  <p className="text-xs leading-snug text-gray-400">{body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Responding + Building culture */}
          <div className="grid gap-8 pt-4 lg:grid-cols-2">
            <div className="flex flex-col justify-between gap-8 rounded-[32px] bg-gray-100 p-8 sm:p-10">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Responding to All Reviews</h3>
                <p className="mt-4 text-base leading-relaxed text-green-700">
                  Even positive ones deserve a &quot;Thank you!&quot; It shows prospective customers that you
                  are active, engaged, and appreciate their business.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex -space-x-3">
                  <img
                    src={AVATAR_1}
                    alt=""
                    className="size-10 rounded-full border-2 border-white object-cover ring-2 ring-slate-200"
                  />
                  <img
                    src={AVATAR_2}
                    alt=""
                    className="size-10 rounded-full border-2 border-white object-cover ring-2 ring-slate-200"
                  />
                </div>
                <p className="text-sm font-medium text-green-700">+45 businesses responded today</p>
              </div>
            </div>
            <div className="flex flex-col gap-4 rounded-[32px] bg-gray-900 p-8 sm:p-10">
              <h3 className="text-2xl font-semibold text-emerald-400">Building a Review Culture</h3>
              <p className="text-base leading-relaxed text-slate-300">
                Make reviews a part of your internal team goals. Reward staff who are mentioned by
                name in positive reviews.
              </p>
              <ul className="mt-2 flex flex-col gap-4 border-t border-white/10 pt-4">
                {[
                  "Incentivize staff training",
                  "Display positive reviews in-store",
                  "Weekly team feedback syncs",
                ].map((line) => (
                  <li key={line} className="flex items-center gap-3 text-base text-white">
                    <Check className="size-4 shrink-0 text-emerald-400" strokeWidth={3} aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Key takeaways */}
          <div className="mx-auto w-full max-w-3xl">
            <div className="rounded-[32px] border border-black/10 bg-gray-100 px-6 py-10 shadow-sm sm:px-10 sm:py-12">
              <div className="mb-8 flex items-center gap-3">
                <Star className="size-5 text-primary" aria-hidden />
                <h3 className="text-2xl font-semibold text-gray-900">Key Takeaways Checklist</h3>
              </div>
              <ul className="flex flex-col gap-6">
                {CHECKLIST.map(({ title, desc }) => {
                  const done = checklistDone[title] ?? false;
                  return (
                    <li key={title} className="flex items-start gap-4 rounded-xl p-2 sm:p-4">
                      <button
                        type="button"
                        onClick={() =>
                          setChecklistDone((prev) => ({ ...prev, [title]: !prev[title] }))
                        }
                        className={cn(
                          "mt-1.25 inline-flex size-4.5 shrink-0 cursor-pointer items-center justify-center rounded-[3px] border shadow-inner transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#158de0]",
                          done
                            ? "border-primary bg-primary ring-1 ring-primary"
                            : "border-gray-300 bg-white ring-1 ring-black/4 hover:border-primary",
                        )}
                        aria-pressed={done}
                        aria-label={done ? `Unmark: ${title}` : `Mark done: ${title}`}
                      >
                        {done ? (
                          <Check className="size-3 text-white" strokeWidth={3} aria-hidden />
                        ) : null}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-snug text-gray-900">{title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-gray-600">{desc}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-2xl bg-gray-100 px-6 py-14 text-center sm:px-12 sm:py-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ready to Put These Tips Into Action?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-gray-600">
              Create or upgrade your Gidira profile and start growing your business today.
            </p>
            <Button
              asChild
              className="mt-8 h-12 rounded-lg bg-primary px-8 text-base font-medium text-white hover:bg-primary/80"
            >
              <Link to="/login" className="inline-flex items-center gap-2">
                <ArrowRight className="size-4" aria-hidden />
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
