import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BadgeDollarSign,
  BookOpenCheck,
  CircleCheck,
  HandCoins,
  Lamp,
  MinusCircle,
  PlusCircle,
  Search,
  TrendingUp,
} from "lucide-react";

import { container } from "@/lib/container";
import { cn } from "@/lib/utils";

function PriceOptionCard({
  title,
  pro,
  con,
}: {
  title: string;
  pro: string;
  con: string;
}) {
  return (
    <div className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
      <h3 className="mb-6 text-xl font-bold text-gray-900">{title}</h3>

      <div className="space-y-3">
        {/* PRO Row */}
        <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
          <PlusCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <p className="text-[13px] font-bold leading-tight text-success">
            {pro}
          </p>
        </div>

        {/* CON Row */}
        <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
          <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
          <p className="text-[13px] font-bold leading-tight text-gray-600">
            {con}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PricingYourServicesRight() {
  return (
    <div className="w-full bg-background">
      <section className="bg-ink py-14 text-center sm:py-20 lg:py-24">
        <div className={cn(container, "flex flex-col items-center")}>
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-success/20 text-success">
            <BadgeDollarSign className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold text-ice sm:text-4xl lg:text-6xl">
            Pricing Your Services Right
          </h1>
          <p className="mt-4 max-w-3xl text-sm text-stat-muted sm:text-base lg:text-xl">
            Set competitive prices that win customers and grow your profit.
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
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">Why Pricing Matters</h2>
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-4 text-base leading-7 text-body-secondary">
                <p>
                  Pricing is more than just a number; it&apos;s a message to your customers. It
                  reflects the quality of your work, your brand position, and your respect for your
                  own time and expertise.
                </p>
                <p>
                  The goal is to find the “Sweet Spot” - the intersection where your customers feel
                  they are getting immense value while you maintain healthy margins for business
                  growth.
                </p>
              </div>
              <div className="rounded-r-xl border-l-4 border-success bg-success/10 p-5">
                <h3 className="text-base font-semibold text-ink">Nigerian Market Reality</h3>
                <p className="mt-2 text-sm italic leading-6 text-body-secondary">
                  “In the Nigerian market, price sensitivity is high, but trust is the ultimate
                  currency. If your price is too low, customers may question your quality. If
                  it&apos;s too high without visible proof of excellence, they&apos;ll choose a
                  competitor.”
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">Research Your Market</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Audit Competitors",
                  text: "Look at 3-5 similar businesses in your area. What do they charge? What's included?",
                  icon: Search,
                },
                {
                  title: "Ask Your Network",
                  text: "Talk to past clients or fellow business owners about industry standards.",
                  icon: HandCoins,
                },
                {
                  title: "Check Benchmarks",
                  text: "Use professional associations or trade unions for regional rate guides.",
                  icon: BookOpenCheck,
                },
              ].map((item) => (
                <article key={item.title} className="rounded-2xl bg-muted p-6">
                  <item.icon className="h-5 w-5 text-green-700" />
                  <h3 className="mt-3 text-xl font-semibold text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-body-secondary">{item.text}</p>
                </article>
              ))}
            </div>
            <div className="rounded-2xl border border-success/20 bg-card p-5 shadow-sm">
              <p className="flex items-center gap-2 text-base font-semibold text-ink ">
                <Lamp className="h-6 w-6 text-green-700 bg-green-200 p-1 rounded-lg" />
                Gidira Search Tip
              </p>
              <p className="mt-2 text-sm italic text-body-secondary">
                “Search for your specific service on Gidira and filter by Top Rated to see what the
                market leaders are charging.”
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">Cost-Based Pricing</h2>
            <p className="text-base text-body-secondary">
              This is the most reliable way to ensure you never lose money. Calculate your true costs
              before setting your final price.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Materials - Cost of all physical items needed to complete service.",
                "Time - Calculate your hourly rate for the time required.",
                "Transport - Fuel, logistics, and commute cost where on-site work is involved.",
                "Overheads - Internet, electricity, subscriptions and tools.",
              ].map((item, idx) => (
                <div key={item} className="rounded-xl bg-muted p-4 text-sm font-medium text-ink">
                  <span className="mr-2 text-placeholder-text">{`0${idx + 1}`}</span>
                  {item}
                </div>
              ))}
            </div>
            {/* Profit Margin Banner */}
            <div className="flex w-full items-center gap-5 rounded-3xl border border-emerald-100 bg-emerald-50 p-6 shadow-sm sm:p-8">
              {/* Icon Box */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-600 text-white shadow-md">
                <TrendingUp className="h-7 w-7" />
              </div>

              {/* Content */}
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-900">
                  05 Profit Margin
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
                  The extra amount that goes back into the business for growth.
                </p>
              </div>
            </div>
          </div>

          {/* Value-Based Pricing Dark Banner */}
          <div className="relative w-full overflow-hidden rounded-[40px] bg-gray-900 px-8 py-10 md:px-12 md:py-14">

            {/* Content Layer */}
            <div className="relative z-10 max-w-2xl space-y-4">
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                Value-Based Pricing
              </h2>
              <p className="text-lg leading-relaxed text-gray-400">
                Instead of charging for your time, charge for the{" "}
                <span className="font-semibold text-emerald-400">result</span>. If your
                service saves a client ₦500,000, charging ₦100,000 is a bargain, even if it
                only took you two hours. Use your expertise and reputation as a multiplier.
              </p>
            </div>

            {/* Watermark Icon Layer using your Icon.svg */}
            <div className="absolute right-12 top-1/2 -translate-y-1/2 select-none pointer-events-none">
              <img
                src="/images/feature/Icon.svg"
                alt=""
                className=""
              />
            </div>
          </div>

          {/* Displaying Prices Section */}
          <div className="py-0 bg-white">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
                Displaying Prices on Gidira
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-2  mx-auto px-4">
              {/* Option 1 */}
              <PriceOptionCard
                title="Option 1: Exact Prices"
                pro='PRO: Builds instant trust and filters out low-budget leads.'
                con='CON: Rigid; no room for custom project adjustments.'
              />

              {/* Option 2 */}
              <PriceOptionCard
                title="Option 2: Price Ranges"
                pro='PRO: Flexible for different project complexities.'
                con='CON: Customers often expect the lower end.'
              />

              {/* Option 3 */}
              <PriceOptionCard
                title="Option 3: Starting From"
                pro='PRO: Great for marketing "entry-level" services.'
                con='CON: Can lead to "sticker shock" later.'
              />

              {/* Option 4 */}
              <PriceOptionCard
                title="Option 4: Contact for Pricing"
                pro='PRO: Perfect for high-end, bespoke consulting.'
                con='CON: May discourage quick-buy customers.'
              />
            </div>
          </div>


          {/* Discounts & Promotions Section */}
          <div className="py-12 bg-white">
            <div className=" mx-auto px-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Discounts & Promotions
              </h2>

              <div className="grid gap-6 md:grid-cols-3">
                {/* First-Time Deals */}
                <div className="rounded-3xl bg-[#f1f3f5] overflow-hidden border-t-[5px] border-[#166941] p-8 transition-transform hover:scale-[1.02]">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    First-Time Deals
                  </h3>
                  <p className="text-[15px] leading-relaxed text-gray-600">
                    Offer a small welcome discount (e.g., 10% off) to lower the barrier for new customers.
                  </p>
                </div>

                {/* Seasonal Promos */}
                <div className="rounded-3xl bg-[#f1f3f5] overflow-hidden border-t-[5px] border-[#166941] p-8 transition-transform hover:scale-[1.02]">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Seasonal Promos
                  </h3>
                  <p className="text-[15px] leading-relaxed text-gray-600">
                    Align with holidays or "back-to-school" periods to drive volume during peaks.
                  </p>
                </div>

                {/* Loyalty Bonuses */}
                <div className="rounded-3xl bg-[#f1f3f5] overflow-hidden border-t-[5px] border-[#166941] p-8 transition-transform hover:scale-[1.02]">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Loyalty Bonuses
                  </h3>
                  <p className="text-[15px] leading-relaxed text-gray-600">
                    Reward repeat customers with fixed rates or "buy 5, get 1 free" structures.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full bg-gray-300 rounded-3xl p-10 md:p-16 shadow-sm border border-gray-300">

              <h2 className="text-3xl font-bold text-black mb-10">Adjusting Your Prices</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <div className="text-green-800">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-clock-4 text-emerald-700"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">When to raise</h3>
                      <p className="text-gray-600 leading-relaxed">
                        When your demand exceeds your capacity, or when inflation significantly impacts your material costs.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-sm flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <div className="text-green-800">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-message-square text-emerald-700"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">How to communicate</h3>
                      <p className="text-gray-600 leading-relaxed">
                        Be transparent. Give existing clients 30 days notice and explain the value increase (e.g., "To maintain the high quality of materials we use...").
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="rounded-4xl bg-brand-red p-18 text-ice">
            <h2 className="text-2xl font-bold">Key Takeaways</h2>
            <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              {[
                "Always cover your base costs.",
                "Benchmark before setting your rates.",
                "Promotion can attract leads, don’t devalue your brand.",
                "Review and adjust pricing every 3-6 months.",
              ].map((tip) => (
                <li key={tip} className="inline-flex items-start gap-2">
                  <CircleCheck className="mt-0.5 h-6 w-6 shrink-0 text-success" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-surface-soft px-4 py-10 text-center sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">Ready to update your listing?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-body-secondary sm:text-base">
              Optimized pricing leads to 30% more conversions. Start upgrading your prices today.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-8 py-3 text-sm font-medium text-ice hover:opacity-90 sm:text-base"
            >
              <CircleCheck className="h-4 w-4" />
              Go to Business Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
