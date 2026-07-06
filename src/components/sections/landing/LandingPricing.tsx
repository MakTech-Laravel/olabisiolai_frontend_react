import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Check, Lock } from "lucide-react";
import { useAuth } from "@/auth/useAuth";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ensureCanStartVendorSignup } from "@/features/vendor/vendorSignupFromCustomerGuard";
import { fetchPublicSubscriptionPackages } from "@/features/subscription/vendorSubscriptionApi";
import { container } from "@/lib/container";
import { formatMoney } from "@/lib/currency";
import {
  TRADE_CHOOSE_PLAN_SECTION_ID,
  storeTradePlanSelection,
  tradePlanActionPath,
  type TradePlanTier,
} from "@/lib/tradeLanding";

const basicFeatures = [
  { text: "Business profile listing", included: true },
  { text: "Up to 5 photos", included: true },
  { text: "Direct customer messages", included: true },
  { text: "WhatsApp integration", included: true },
  { text: "Basic analytics only", included: false },
  { text: "No boost access", included: false },
] as const;

const DEFAULT_PREMIUM_FEATURES = [
  "Everything in Basic",
  "Full analytics dashboard",
  "Boost & analytics (verification sold separately)",
  "Priority boost access",
  "Featured in search results",
] as const;

const BILLING_PERIOD_SUFFIX: Record<string, string> = {
  monthly: "/month",
  quarterly: "/quarter",
  yearly: "/year",
  lifetime: "",
};

function PlanCtaButton({
  plan,
  className,
  children,
}: {
  plan: TradePlanTier;
  className: string;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isSessionLoading, isUserLoading } = useAuth();
  const authReady = !isSessionLoading && !isUserLoading;

  const handleClick = async () => {
    if (isAuthenticated && !(await ensureCanStartVendorSignup(user, logout))) {
      return;
    }
    storeTradePlanSelection(plan);
    navigate(tradePlanActionPath(plan, isAuthenticated));
  };

  if (!authReady) {
    return (
      <button type="button" disabled className={className}>
        {children}
      </button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link
        to={tradePlanActionPath(plan, false)}
        onClick={() => storeTradePlanSelection(plan)}
        className={className}
      >
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => void handleClick()} className={className}>
      {children}
    </button>
  );
}

export function LandingPricing() {
  const packagesQuery = useQuery({
    queryKey: ["public", "subscription-packages"],
    queryFn: fetchPublicSubscriptionPackages,
    staleTime: 60_000,
  });

  const packages = packagesQuery.data?.packages ?? [];
  const premiumPlan = packages.find((p) => p.is_recommended) ?? packages[0];
  const premiumFeatures = premiumPlan?.perks?.length ? premiumPlan.perks : DEFAULT_PREMIUM_FEATURES;
  const billingSuffix = premiumPlan?.billing_period
    ? (BILLING_PERIOD_SUFFIX[premiumPlan.billing_period] ?? "")
    : "/year";

  return (
    <section
      id={TRADE_CHOOSE_PLAN_SECTION_ID}
      className="scroll-mt-24 bg-surface-wash px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className={container}>
        <ScrollReveal className="mb-12 text-center md:mb-16">
          <h2 className="text-2xl font-extrabold text-ink sm:text-3xl sm:leading-9">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-base text-ink-muted">
            Start free or go premium. Upgrade anytime as your business grows.
          </p>
        </ScrollReveal>

        <div className="mx-auto flex max-w-4xl flex-col gap-8 lg:flex-row lg:justify-center">
          <ScrollReveal className="flex-1 lg:max-w-md">
            <div className="h-full rounded-2xl border border-plan-ring bg-white p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-ink-heading">Basic</h3>
              <p className="mt-2 text-4xl font-bold leading-10 text-ink">Free</p>
              <p className="mt-1 text-xs text-placeholder-text">
                Perfect for getting started on Gidira.
              </p>
              <ul className="mt-8 flex list-none flex-col gap-4 p-0">
                {basicFeatures.map((row) => (
                  <li key={row.text} className="flex items-center gap-2 text-sm">
                    {row.included ? (
                      <Check
                        className="size-4 shrink-0 text-brand"
                        strokeWidth={2.5}
                      />
                    ) : (
                      <Lock className="size-4 shrink-0 text-placeholder-text" />
                    )}
                    <span
                      className={
                        row.included
                          ? "text-body-secondary"
                          : "text-placeholder-text"
                      }
                    >
                      {row.text}
                    </span>
                  </li>
                ))}
              </ul>
              <PlanCtaButton
                plan="basic"
                className="mt-8 flex w-full items-center justify-center rounded-lg border border-border-gray py-3.5 font-heading text-sm font-bold text-ink-heading"
              >
                Get Started Free
              </PlanCtaButton>
            </div>
          </ScrollReveal>

          <ScrollReveal delayMs={120} className="flex-1 lg:max-w-md">
            <div className="relative h-full rounded-2xl border-2 border-brand-red bg-white p-8 shadow-xl">
              <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-red px-4 py-1 font-heading text-[10px] font-bold uppercase tracking-wider text-white">
                Most Popular
              </div>
              <h3 className="text-lg font-semibold text-ink-heading">{premiumPlan?.title ?? "Premium"}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-ink">
                  {formatMoney(premiumPlan?.amount ?? 0, packagesQuery.data?.currency)}
                </span>
                {billingSuffix ? <span className="text-sm text-placeholder-text">{billingSuffix}</span> : null}
              </div>
              {premiumPlan?.original_price ? (
                <p className="mt-1 text-sm text-placeholder-text line-through">
                  {formatMoney(premiumPlan.original_price, packagesQuery.data?.currency)}
                </p>
              ) : null}
              {premiumPlan?.promotional_text ? (
                <p className="mt-1 text-xs font-semibold text-brand-red">{premiumPlan.promotional_text}</p>
              ) : null}
              <p className="mt-1 text-xs text-placeholder-text">
                {premiumPlan?.description || "For serious vendors who want to grow fast."}
              </p>
              <ul className="mt-8 flex list-none flex-col gap-4 p-0">
                {premiumFeatures.map((text) => (
                  <li
                    key={text}
                    className="flex items-center gap-2 text-sm text-body-secondary"
                  >
                    <Check
                      className="size-4 shrink-0 text-brand"
                      strokeWidth={2.5}
                    />
                    {text}
                  </li>
                ))}
              </ul>
              <PlanCtaButton
                plan="premium"
                className="mt-8 flex w-full items-center justify-center rounded-lg bg-brand-red py-3 text-sm font-medium text-white"
              >
                Start Premium
              </PlanCtaButton>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
