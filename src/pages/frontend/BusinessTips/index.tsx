import type { ComponentType, SVGProps } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  CircleDollarSign,
  Megaphone,
  PencilLine,
  Reply,
  Star,
  Triangle,
} from "lucide-react";

import { container } from "@/lib/container";
import { cn } from "@/lib/utils";

type Tip = {
  title: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconWrapClass: string;
  iconClass: string;
  to?: string;
};

const BUSINESS_TIPS: Tip[] = [
  {
    title: "Photos That Sell",
    description:
      "Learn how to take professional-quality photos of your business, products, and services using just your phone. Good images can increase enquiries by up to 3x.",
    icon: Camera,
    iconWrapClass: "bg-tint-red",
    iconClass: "text-brand-red",
    to: "/business-tips/photos-that-sell",
  },
  {
    title: "Writing a Compelling Description",
    description:
      "Your business description is your first impression. Learn how to write clear, persuasive copy that tells customers exactly what you offer and why they should choose you.",
    icon: PencilLine,
    iconWrapClass: "bg-surface-soft",
    iconClass: "text-brand",
    to: "/business-tips/writing-a-compelling-description",
  },
  {
    title: "Responding to Customer Enquiries",
    description:
      "Speed and professionalism matter. Tips for responding quickly, answering questions effectively, and converting enquiries into paying customers.",
    icon: Reply,
    iconWrapClass: "bg-surface-soft",
    iconClass: "text-avatar-a",
    to: "/business-tips/responding-to-customer-enquiries",
  },
  {
    title: "Pricing Your Services Right",
    description:
      "How to research your market, set competitive prices, and communicate value. Includes tips on displaying pricing on your Gidira profile.",
    icon: CircleDollarSign,
    iconWrapClass: "bg-surface-soft",
    iconClass: "text-avatar-b",
    to: "/business-tips/pricing-your-services-right",
  },
  {
    title: "Getting More Positive Reviews",
    description:
      "Strategies for encouraging happy customers to leave reviews, handling negative feedback gracefully, and building a strong reputation.",
    icon: Star,
    iconWrapClass: "bg-surface-soft",
    iconClass: "text-brand",
    to: "/business-tips/getting-more-positive-reviews",
  },
  {
    title: "Marketing Beyond Gidira",
    description:
      "How to use social media, WhatsApp Business, and word-of-mouth alongside your Gidira listing to build a complete marketing strategy.",
    icon: Megaphone,
    iconWrapClass: "bg-surface-soft",
    iconClass: "text-brand",
    to: "/business-tips/marketing-beyond-gidira",
  },
];

export default function BusinessTips() {
  return (
    <div className="w-full bg-muted">
      <section className="bg-footer-bar py-12 sm:py-14 lg:py-16">
        <div className={cn(container, "flex flex-col items-center gap-4 text-center")}>
          <h1 className="text-3xl font-extrabold leading-tight text-ice sm:text-4xl sm:leading-10">
            Business Tips
          </h1>
          <p className="max-w-2xl text-base leading-7 text-footer-muted sm:text-lg">
            Practical advice to help Nigerian businesses grow and succeed online
          </p>
        </div>
      </section>

      <section className="py-8 sm:py-10 lg:py-14">
        <div className={cn(container, "grid gap-4 sm:gap-6 md:grid-cols-2")}>
          {BUSINESS_TIPS.map((tip) => {
            const Icon = tip.icon;
            const content = (
              <article className="rounded-xl border border-border-gray bg-card p-5 shadow-sm sm:p-6 lg:p-8">
                <div
                  className={cn(
                    "mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg",
                    tip.iconWrapClass,
                  )}
                >
                  <Icon className={cn("h-5 w-5", tip.iconClass)} />
                </div>
                <h2 className="text-xl font-bold leading-7 text-ink-heading sm:text-2xl">
                  {tip.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-body-secondary">{tip.description}</p>
              </article>
            );

            if (!tip.to) return <div key={tip.title}>{content}</div>;

            return (
              <Link key={tip.title} to={tip.to} className="block transition-opacity hover:opacity-95">
                {content}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="pb-10 sm:pb-12 lg:pb-16">
        <div className={cn(container)}>
          <div className="rounded-2xl border border-plan-ring bg-ink px-5 py-10 text-center sm:px-8 sm:py-12 lg:px-10 lg:py-16">
            <h2 className="text-2xl font-extrabold leading-tight text-ice sm:text-3xl lg:text-4xl">
              Ready to Put These Tips Into Action?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-stat-muted sm:text-base">
              Create or upgrade your Gidira profile and start growing your business today.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-ice transition-opacity hover:opacity-90 sm:px-8 sm:text-base"
            >
              <Triangle className="h-4 w-4 fill-current" />
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
