import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  PenSquare,
} from "lucide-react";

import { container } from "@/lib/container";
import { cn } from "@/lib/utils";

/** Hero photo from Figma (node 591:4771), exported to repo: olabisiolai--Copy- */
const HERO_IMAGE = "/images/business-tips/writing-compelling-description-hero.jpg";

const PERFECT_STRUCTURE_STEPS = [
  {
    number: 1,
    title: "Opening Hook",
    subtitle: "(1-2 sentences)",
    description:
      'Start with something that resonates with your ideal customer. Answer "What\'s your promise to me?" in your opening.',
  },
  {
    number: 2,
    title: "What You Offer",
    subtitle: "(2-3 sentences)",
    description:
      "Clearly state your core services or products. Be specific—don't be vague about your value proposition.",
  },
  {
    number: 3,
    title: "Why You're Different",
    subtitle: "(2-3 sentences)",
    description:
      "What sets you apart? Is it your experience, quality, speed, pricing, or something else entirely?",
  },
  {
    number: 4,
    title: "Social Proof",
    subtitle: "(1-2 sentences)",
    description:
      "Mention years in business, number of satisfied customers, certifications, or awards to build credibility.",
  },
  {
    number: 5,
    title: "Call to Action",
    subtitle: "(1 sentence)",
    description:
      'Tell them exactly how to contact you or what the next step is (e.g., "Send a message through BizGuide").',
  },
];

export default function WritingACompellingDescription() {
  return (
    <div className="w-full bg-background">
      <section className="bg-ink py-14 text-center sm:py-20 lg:py-24">
        <div className={cn(container, "flex flex-col items-center")}>
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-success/20 text-success">
            <PenSquare className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold text-ice sm:text-4xl lg:text-6xl">
            Writing a Compelling Description
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-stat-muted sm:text-base lg:text-xl">
            Craft descriptions that convert visitors into customers and build immediate trust for
            your brand.
          </p>
        </div>
      </section>

      <section className="py-6">
        <div className={cn(container)}>
          <Link
            to="/business-tips"
            className="inline-flex items-center gap-2 text-sm font-medium text-body-secondary hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Business Tips
          </Link>
        </div>
      </section>

      <section className="pb-10 lg:pb-16">
        <div className={cn(container, "space-y-8 lg:space-y-12")}>
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-ink lg:text-3xl">First Impressions Count</h2>
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-4 text-base leading-7 text-body-secondary">
                <p>
                  Your business description is often the first thing a potential customer reads
                  about you on Gidira. While photos grab attention, your description explains what
                  you do and why someone should choose you over competitors.
                </p>
                <p>
                  Profiles with detailed, well-written descriptions receive{" "}
                  <span className="font-semibold text-success">3x more inquiries</span> than those
                  with vague or missing information.
                </p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border-light bg-card p-2 shadow-md">
                <img
                  src={HERO_IMAGE}
                  alt="Person writing in a notebook next to a laptop in a bright office"
                  className="h-52 w-full rounded-xl object-cover sm:h-64"
                  decoding="async"
                />
              </div>
            </div>
            <div className="rounded-r-xl border-l-4 border-success bg-success/10 p-5">
              <p className="text-sm font-semibold text-ink">Gidira Insight</p>
              <p className="mt-2 text-sm italic text-body-secondary">
                Customers look for key pieces of info: what you offer, how you&apos;re different,
                your experience, and how to contact you.
              </p>
            </div>
          </div>

          {/* ── The Perfect Structure ── */}
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">The Perfect Structure</h2>
            <div className="flex flex-col gap-3">
              {PERFECT_STRUCTURE_STEPS.map((step) => (
                <div
                  key={step.number}
                  className="flex items-start gap-5 rounded-2xl border border-border-light bg-card px-6 py-5 shadow-sm"
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success">
                    <span className="text-sm font-bold text-white">{step.number}</span>
                  </div>
                  <div>
                    <p className="text-base font-bold leading-snug text-ink">
                      {step.title}{" "}
                      <span className="font-normal">{step.subtitle}</span>
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-body-secondary">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className=" flex items-center justify-center">
            <div className="flex flex-col md:flex-row gap-5 w-full container">

              {/* Left Dark Card: What to Include */}
              <div className="flex-1 bg-gray-800 text-white rounded-2xl p-8 shadow-xl">
                <h2 className="text-xl font-bold mb-6 tracking-tight">What to Include</h2>

                <ul className="space-y-5">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 border-success flex items-center justify-center">
                      <svg className="w-3 h-3 text-success" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <p className="text-sm leading-snug">
                      <strong className="font-semibold">Location:</strong> Specific neighborhoods or LGAs you serve.
                    </p>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 border-success flex items-center justify-center">
                      <svg className="w-3 h-3 text-success" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <p className="text-sm leading-snug">
                      <strong className="font-semibold">Pricing:</strong> Starting rates or mention of free consultations.
                    </p>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 border-success flex items-center justify-center">
                      <svg className="w-3 h-3 text-success" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <p className="text-sm leading-snug">
                      <strong className="font-semibold">Background:</strong> A personal story or brand history.
                    </p>
                  </li>
                </ul>
              </div>

              {/* Right Light Card: Services/Products List */}
              <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">Services/Products List</h2>
                <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                  Don't just say "plumbing services"—be specific about what you offer to help search ranking.
                </p>

                {/* Pro Tip Box */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-2">Pro Tip:</p>
                  <p className="text-sm text-gray-700 italic leading-relaxed">
                    "We provide 24/7 emergency plumbing for homes and businesses across Lagos. From burst pipes to toilet repairs..."
                  </p>
                </div>
              </div>

            </div>
          </div>

          <div className=" bg-white flex items-center justify-center ">
            <div className="w-full ">

              {/* Section Header */}
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 whitespace-nowrap">Power Words That Convert</h2>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                {/* Card 1 */}
                <div className="border border-gray-200 rounded-2xl py-6 px-4 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow duration-200">
                  <span className="text-success font-semibold text-base mb-1">Verified</span>
                  <span className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Trust</span>
                </div>

                {/* Card 2 */}
                <div className="border border-gray-200 rounded-2xl py-6 px-4 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow duration-200">
                  <span className="text-success font-semibold text-base mb-1">Guaranteed</span>
                  <span className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Quality</span>
                </div>

                {/* Card 3 */}
                <div className="border border-gray-200 rounded-2xl py-6 px-4 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow duration-200">
                  <span className="text-success font-semibold text-base mb-1">Professional</span>
                  <span className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Expertise</span>
                </div>

                {/* Card 4 */}
                <div className="border border-gray-200 rounded-2xl py-6 px-4 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow duration-200">
                  <span className="text-success font-semibold text-base mb-1">Exceptional</span>
                  <span className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Action</span>
                </div>

              </div>
            </div>
          </div>

          <div className="bg-white flex items-center justify-center">
            <div className="w-full bg-gray-100 rounded-2xl p-8">

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-7">Common Mistakes to Avoid</h2>

              {/* 2-column grid of mistakes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-7">

                {/* Item 1 */}
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 mt-0.5">
                    {/* Alert circle icon */}
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-1">Too Short</p>
                    <p className="text-sm text-gray-500 leading-relaxed">A one or two sentence description isn't enough. Aim for at least 3–4 sentences.</p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-1">Copying Competitors</p>
                    <p className="text-sm text-gray-500 leading-relaxed">Never copy. This looks unprofessional and search engines may penalize your listing.</p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-1">Using All Caps</p>
                    <p className="text-sm text-gray-500 leading-relaxed uppercase tracking-wide">WRITING LIKE THIS LOOKS UNPROFESSIONAL AND AGGRESSIVE.</p>
                    <p className="text-sm text-gray-500 leading-relaxed">Use normal capitalization.</p>
                  </div>
                </div>

                {/* Item 4 */}
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm mb-1">Being Too Vague</p>
                    <p className="text-sm text-gray-500 leading-relaxed">"We provide business services" is weak. Say "We provide bookkeeping and tax planning."</p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="bg-white flex items-start justify-center">
            <div className="w-full">

              {/* Page Title */}
              <h1 className="lg:text-3xl text-2xl font-bold text-gray-900 text-center mb-10">
                Examples by Industry
              </h1>

              {/* Industry Cards */}
              <div className="space-y-5">

                {/* Card 1: Restaurant / Catering */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  {/* Card Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-900">Restaurant / Catering</h2>
                    <span className="text-sm text-gray-400">Case Study</span>
                  </div>

                  {/* Card Body */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 py-6">
                    {/* Before */}
                    <div>
                      <p className="text-[11px] font-semibold tracking-widest text-red-500 uppercase mb-3">
                        Before (Too Vague)
                      </p>
                      <p className="text-sm text-gray-600 italic leading-relaxed">
                        "We provide food services. We make delicious meals. Call us for catering."
                      </p>
                    </div>

                    {/* After */}
                    <div className="bg-green-50 rounded-xl p-5">
                      <p className="text-[11px] font-semibold tracking-widest text-green-600 uppercase mb-3">
                        After (Compelling)
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        "Authentic Nigerian cuisine with a modern twist. We specialize in corporate catering and weddings across Lagos. Our signature jollof rice is made fresh daily..."
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card 2: Tech & Phone Repair */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  {/* Card Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-900">Tech & Phone Repair</h2>
                    <span className="text-sm text-gray-400">Case Study</span>
                  </div>

                  {/* Card Body */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 py-6">
                    {/* Before */}
                    <div>
                      <p className="text-[11px] font-semibold tracking-widest text-red-500 uppercase mb-3">
                        Before (Too Vague)
                      </p>
                      <p className="text-sm text-gray-600 italic leading-relaxed">
                        "Phone and computer repair. We fix all brands."
                      </p>
                    </div>

                    {/* After */}
                    <div className="bg-green-50 rounded-xl p-5">
                      <p className="text-[11px] font-semibold tracking-widest text-green-600 uppercase mb-3">
                        After (Compelling)
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        "Expert phone and laptop repair for all major brands. 30-minute response time and 6-month warranty on all repairs. Located on Awolowo Road with pickup available."
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-surface-soft px-4 py-10 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">
              Ready to Put These Tips Into Action?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-body-secondary sm:text-base">
              Update your description today and see the difference it makes in your customer
              conversion rate.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-8 py-3 text-sm font-medium text-ice hover:opacity-90 sm:text-base"
            >
              <CheckCircle2 className="h-4 w-4" />
              Improve Your Profile
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}