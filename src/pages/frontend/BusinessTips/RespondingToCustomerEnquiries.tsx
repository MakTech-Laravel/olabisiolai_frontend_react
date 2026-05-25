import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bot,
  Check,
  CheckCircle2,
  Clock,
  Layout,
  MessageCircleReply,
  Share2,
  Star,
  TrendingUp,
} from "lucide-react";

import { container } from "@/lib/container";
import { cn } from "@/lib/utils";

const HERO_IMAGE = "/images/feature/backgrounds.png";

const CHECKLIST = [
  {
    title: "Respond within 10 minutes",
    desc: "Speed signals professionalism and keeps warm leads from going cold.",
  },
  {
    title: "Personalize your greeting",
    desc: "Use the customer's name and reference their enquiry to build trust fast.",
  },
  {
    title: "Lean on simple templates",
    desc: "Reusable snippets keep replies fast without sounding robotic.",
  },
  {
    title: "Follow up at least twice",
    desc: "If they go quiet, a gentle nudge often closes what the first reply started.",
  },
  {
    title: "End with a clear call-to-action",
    desc: "Tell them exactly what to do next—book, pay, choose a slot, or reply with a detail.",
  },
] as const;

// ─── Enquiry Templates Sub-Component ────────────────────────────────────────

function EnquiryTemplates() {
  const [showToast, setShowToast] = useState(false);

  const templates = [
    {
      id: 1,
      title: "Pricing Enquiry",
      text: "Hi [Name]! Our [Product] starts at ₦[Price]. This includes [Benefit A] and [Benefit B]. Would you like a full quote?",
      animation: "animate-[fadeUp_0.5s_0.1s_ease_both]",
      icon: (
        <svg className="w-6 h-6 text-[#166941]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
        </svg>
      ),
    },
    {
      id: 2,
      title: "Availability",
      text: "Hello [Name], we are available for bookings on [Dates]. Which time slot works best for your schedule?",
      animation: "animate-[fadeUp_0.5s_0.2s_ease_both]",
      icon: (
        <svg className="w-6 h-6 text-[#166941]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
        </svg>
      ),
    },
    {
      id: 3,
      title: "Service Area",
      text: "We are based in [City] and cover [Area A, B, and C]. We can also arrange delivery to [Region] for an extra fee.",
      animation: "animate-[fadeUp_0.5s_0.3s_ease_both]",
      icon: (
        <svg className="w-6 h-6 text-[#166941]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
      ),
    },
  ];

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <div className="font-sans flex items-center justify-center bg-white">
      <style>{`
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(18px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="w-full">
        {/* Header */}
        <div className="mb-8 animate-[fadeUp_0.5s_ease_both]">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-1.5">
            Common Enquiry Templates
          </h2>
          <p className="text-sm text-gray-500">
            Save these to your keyboard shortcuts for lightning-fast replies.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((item) => (
            <div
              key={item.id}
              className={`group border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col gap-5 transition-all duration-[0.22s] hover:-translate-y-[3px] hover:shadow-[0_10px_32px_0_rgba(22,105,65,0.10)] ${item.animation}`}
            >
              <div className="bg-[#f1f5f9] rounded-xl w-[52px] h-[52px] flex items-center justify-center">
                {item.icon}
              </div>

              <div className="flex flex-col gap-2 flex-1">
                <h3 className="font-display text-[0.95rem] font-bold text-gray-900">{item.title}</h3>
                <p className="text-[0.82rem] text-gray-500 leading-relaxed flex-1">
                  "{item.text}"
                </p>
              </div>

              <button
                onClick={() => handleCopy(item.text)}
                className="inline-flex items-center gap-[6px] transition-all duration-200 hover:gap-[9px] font-display text-[0.82rem] font-semibold text-[#166941] hover:text-[#145436] w-fit mt-auto"
              >
                Copy Template
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Toast Notification */}
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#166941] text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2 ${showToast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          Copied to clipboard!
        </div>
      </div>
    </div>
  );
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default function RespondingToCustomerEnquiries() {
  const [checklistDone, setChecklistDone] = useState<Record<string, boolean>>({});

  return (
    <div className="w-full bg-background">
      <section className="bg-ink py-14 text-center sm:py-20 lg:py-24">
        <div className={cn(container, "flex flex-col items-center")}>
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-success/20 text-success">
            <MessageCircleReply className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold text-ice sm:text-4xl lg:text-6xl">
            Responding to Customer Enquiries
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-stat-muted sm:text-base lg:text-xl">
            Turn every message into a relationship. Master fast, professional communication that
            helps your Nigerian business grow.
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

          {/* Speed is Everything + Greetings */}
          <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-10 bg-white">

            {/* LEFT COLUMN: Speed is Everything */}
            <div className="flex-1 items-start justify-center p-4 md:p-6 font-sans bg-gray-100 rounded-2xl">
              <div className="w-full grid grid-cols-1 gap-4">
                <div className="p-4 md:p-7 animate-fade-up">
                  <h2 className="font-display text-[1.45rem] font-bold text-gray-900 mb-5 tracking-tight">
                    Speed is Everything
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="stat-card bg-white rounded-xl p-5 animate-fade-up-2 transition-all duration-200 hover:-translate-y-0.5">
                      <p className="font-display text-5xl font-extrabold text-success leading-none mb-3">
                        5<span className="text-3xl">min</span>
                      </p>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Responding within 5 minutes increases lead conversion by{" "}
                        <strong className="font-semibold text-gray-800">9x</strong>.
                      </p>
                    </div>

                    <div className="stat-card bg-white rounded-xl p-5 animate-fade-up-3 transition-all duration-200 hover:-translate-y-0.5 shadow-[0_8px_28px_0_rgba(22,105,65,0.10)]">
                      <p className="font-display text-5xl font-extrabold text-success leading-none mb-3">
                        78<span className="text-3xl">%</span>
                      </p>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Customers buy from the business that{" "}
                        <strong className="font-semibold text-brand-700">responds first</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="bg-success/10 rounded-xl px-4 py-3 flex items-start sm:items-center gap-3 animate-fade-up-4">
                    <svg
                      className="shrink-0 w-5 h-5 text-brand-600 animate-pulse2 mt-1 sm:mt-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.955 11.955 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.25-8.25-3.286Z"
                      />
                    </svg>
                    <p className="text-sm font-medium text-brand-800">
                      <span className="font-bold">Pro tip:</span> Enable push notifications and use quick replies for common questions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Greetings & Names */}
            <div className="flex flex-col gap-4 lg:w-[350px]">
              <div className="bg-gray-100 rounded-2xl p-5 shadow-sm animate-fade-up-3 transition-all duration-200 hover:-translate-y-px">
                <div className="flex items-center gap-2 mb-3">
                  <svg
                    className="w-5 h-5 text-success"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                    />
                  </svg>
                  <h3 className="font-display text-[0.95rem] font-bold text-gray-900 tracking-tight">
                    Professional Greetings
                  </h3>
                </div>
                <p className="text-[0.82rem] text-gray-500 mb-3 leading-relaxed">
                  Always start with a warm, branded greeting. Set the tone immediately.
                </p>
                <blockquote className="border-l-4 border-success bg-white/50 rounded-lg pl-3 pr-4 py-2.5">
                  <p className="text-[0.78rem] font-mono italic text-gray-600 leading-relaxed">
                    "Good day! Thank you for reaching out to [Business Name]..."
                  </p>
                </blockquote>
              </div>

              <div className="bg-gray-100 rounded-2xl p-6 md:p-10 shadow-sm animate-fade-up-4 transition-all duration-200">
                <div className="flex items-center gap-2 mb-3">
                  <svg
                    className="w-5 h-5 text-success"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z"
                    />
                  </svg>
                  <h3 className="font-display text-[0.95rem] font-bold text-gray-900 tracking-tight">
                    Use Their Name
                  </h3>
                </div>
                <p className="text-[0.82rem] text-gray-500 leading-relaxed">
                  Personalization builds trust instantly. Use the name provided in their profile or enquiry.
                </p>
              </div>
            </div>
          </div>

          {/* Enquiry Templates */}
          <EnquiryTemplates />

          {/* Handling Price Negotiations Section */}
          <div className="w-full rounded-[32px] bg-[#0b1926] p-8 md:p-12 lg:p-16 overflow-hidden">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">

              {/* Left Content */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl tracking-tight">
                    Handling Price Negotiations
                  </h2>
                  <p className="text-gray-400 text-lg max-w-md leading-relaxed">
                    Nigerian customers value a good deal, but your value shouldn't be
                    compromised. Here's how to balance both.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Item 1 */}
                  <div className="flex gap-4 items-start">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#166941]">
                      <Star className="h-5 w-5 text-white fill-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">When to Negotiate</h3>
                      <p className="mt-1 text-gray-400 text-sm leading-relaxed">
                        Negotiate for bulk orders or long-term contracts. Offer a "loyalty discount"
                        instead of just lowering the price.
                      </p>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="flex gap-4 items-start">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#b91c1c]">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Standing Firm on Value</h3>
                      <p className="mt-1 text-gray-400 text-sm leading-relaxed">
                        Remind them of the quality, warranty, or results they won't get elsewhere. Value {'>'} Price.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Content: Image Card */}
              <div className="relative rounded-3xl bg-[#1a2b3b] p-6 lg:p-10 shadow-2xl">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-black">
                  <img
                    src={HERO_IMAGE}
                    alt="Hands on a laptop"
                    className="h-full w-full object-cover opacity-80"
                  />
                  {/* Overlay graphic to mimic the futuristic circles in the image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center">
                    <div className="w-32 h-32 border border-white/10 rounded-full animate-pulse flex items-center justify-center">
                      <div className="w-16 h-16 border border-white/20 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <p className="text-lg italic text-gray-300 leading-relaxed font-light">
                    "The aim is not just to sell once, but to create a customer
                    who believes in your worth."
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Converting to Sales & Managing Volume Section */}
          <div className="grid gap-6 md:grid-cols-2">

            {/* LEFT CARD: Converting to Sales */}
            <div className="rounded-[40px] bg-[#f3f4f6] p-8 md:p-10">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Converting to Sales</h2>
              </div>

              <div className="space-y-4">
                {/* Nested White Card 1 */}
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900">Ask the Right Questions</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    Don't just answer; engage. Ask: "What specific problem are you trying to solve?"
                  </p>
                </div>

                {/* Nested White Card 2 */}
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900">Offer Next Steps</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    End every reply with a call to action. "Should I send the invoice now?" or "Can we hop on a 2-min call?"
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT CARD: Managing Volume */}
            <div className="rounded-[40px] bg-[#f3f4f6] p-8 md:p-10">
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600">
                  <Share2 className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Managing Volume</h2>
              </div>

              <div className="space-y-8">
                {/* List Item 1 */}
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Layout className="h-5 w-5" />
                  </div>
                  <p className="text-[15px] leading-snug text-gray-600">
                    Use <span className="font-bold text-gray-900">Labels</span> in WhatsApp Business to track leads (New, Pending, Paid).
                  </p>
                </div>

                {/* List Item 2 */}
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Clock className="h-5 w-5" />
                  </div>
                  <p className="text-[15px] leading-snug text-gray-600">
                    Set clear "Enquiry Hours" to manage expectations and prevent burnout.
                  </p>
                </div>

                {/* List Item 3 */}
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Bot className="h-5 w-5" />
                  </div>
                  <p className="text-[15px] leading-snug text-gray-600">
                    Utilize automated "Away Messages" for enquiries received after-hours.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* The Follow-Up Engine Section */}
          <div className="rounded-[40px] bg-[#f3f4f6] px-6 py-12 text-center sm:px-10 sm:py-16">
            <div className="mx-auto max-w-2xl">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                The Follow-Up Engine
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-gray-500">
                80% of sales require 5 follow-up contacts. Most businesses stop after one.
              </p>
            </div>

            {/* Timeline Steps */}
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-0">
              {/* Step 1 */}
              <div className="flex w-full max-w-[180px] flex-col items-center rounded-2xl bg-white py-6 shadow-sm">
                <p className="text-2xl font-bold text-[#166941]">24h</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  The Warm Up
                </p>
              </div>

              {/* Connector Line 1 */}
              <div className="hidden h-[2px] w-12 bg-gray-300 sm:block" />

              {/* Step 2 */}
              <div className="flex w-full max-w-[180px] flex-col items-center rounded-2xl bg-white py-6 shadow-sm">
                <p className="text-2xl font-bold text-[#166941]">48h</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  The Value Drop
                </p>
              </div>

              {/* Connector Line 2 */}
              <div className="hidden h-[2px] w-12 bg-gray-300 sm:block" />

              {/* Step 3 */}
              <div className="flex w-full max-w-[180px] flex-col items-center rounded-2xl bg-white py-6 shadow-sm">
                <p className="text-2xl font-bold text-[#166941]">72h</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  The Final Call
                </p>
              </div>
            </div>

            {/* When to Stop Box */}
            <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-red-100 bg-red-50/50 p-6 text-left">
              <div className="flex items-center gap-2 text-red-700">
                <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-red-700 text-[10px] font-bold">
                  ✕
                </div>
                <h3 className="font-bold">When to Stop?</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                After 3 follow-ups with no response, move the lead to a "Cold" list and stop active outreach to save your energy.
              </p>
            </div>
          </div>

          {/* Key takeaways */}
          <div className="mx-auto w-full max-w-3xl">
            <div className="rounded-[32px]   bg-white px-6 py-10 shadow-md sm:px-10 sm:py-12">
              <div className="mb-8 flex items-center gap-3">
                <Star className="size-5 text-[#158de0]" aria-hidden />
                <h3 className="text-2xl font-semibold text-[#191c1e]">Key Takeaways Checklist</h3>
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
                            ? "border-[#158de0] bg-[#158de0] ring-1 ring-[#158de0]/25"
                            : "border-[#b8bcc8] bg-white ring-1 ring-black/4 hover:border-[#158de0]/60",
                        )}
                        aria-pressed={done}
                        aria-label={done ? `Unmark: ${title}` : `Mark done: ${title}`}
                      >
                        {done ? (
                          <Check className="size-3 text-white" strokeWidth={3} aria-hidden />
                        ) : null}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-snug text-[#191c1e]">{title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-[#44474d]">{desc}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="rounded-3xl bg-surface-soft px-4 py-10 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">
              Ready to Start Converting More Enquiries Today?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-body-secondary sm:text-base">
              Small improvements in response speed and clarity create meaningful growth.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-8 py-3 text-sm font-medium text-ice hover:opacity-90 sm:text-base"
            >
              Update Your Profile
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}