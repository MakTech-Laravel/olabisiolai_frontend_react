import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import type { BoostPlanCampaignStatus } from "@/features/boost/boostCampaignTypes";
import { cn } from "@/lib/utils";

import { type Plan } from "./boostPlanData";

const getBgClasses = (colorScheme: Plan["colorScheme"]) => {
  switch (colorScheme) {
    case "orange":
      return "bg-orange-50 border border-orange-200";
    case "gray":
      return "bg-gray-100 border-2 border-gray-300";
    case "yellow":
      return "bg-yellow-50 border border-yellow-300";
  }
};

const getMedalGradient = (colorScheme: Plan["colorScheme"]) => {
  switch (colorScheme) {
    case "orange":
      return "from-amber-600 to-amber-300";
    case "gray":
      return "from-gray-400 to-gray-200";
    case "yellow":
      return "from-yellow-500 to-yellow-300";
  }
};

const getRadioBorder = (colorScheme: Plan["colorScheme"]) => {
  return colorScheme === "yellow" ? "border-yellow-600" : "border-gray-700";
};

const getRadioAccent = (colorScheme: Plan["colorScheme"]) => {
  return colorScheme === "yellow" ? "accent-yellow-600" : "accent-gray-800";
};

const getButtonClasses = (colorScheme: Plan["colorScheme"]) => {
  switch (colorScheme) {
    case "orange":
      return "bg-red-500 hover:bg-red-600";
    case "gray":
      return "bg-gray-800 hover:bg-gray-900";
    case "yellow":
      return "bg-yellow-700 hover:bg-yellow-800";
  }
};

const getSlotText = (plan: Plan) => {
  if (plan.slotLabel) {
    return plan.slotLabel;
  }
  return plan.slotStatus === "available"
    ? "Slots available in this LGA"
    : "No slots available — fully booked";
};

const getSlotColor = (slotStatus: Plan["slotStatus"]) => {
  return slotStatus === "available" ? "text-green-600" : "text-red-500";
};

const getSlotDotColor = (slotStatus: Plan["slotStatus"]) => {
  return slotStatus === "available" ? "bg-green-500" : "bg-red-500";
};

export type BoostPlanSelection = {
  planId: string;
  planTitle: string;
  durationLabel: string;
  durationDays: number;
  priceLabel: string;
  amount: number;
};

export function BoostPlanCard({
  plan,
  durationAmounts,
  onSelect,
  disabled,
  isSubmitting = false,
  highlighted = false,
  defaultDurationDays,
  campaignStatus = null,
}: {
  plan: Plan;
  /** Map duration label (e.g. "7 Days") to numeric amount — from location LGA config */
  durationAmounts?: Record<string, number>;
  onSelect?: (selection: BoostPlanSelection) => void;
  disabled?: boolean;
  isSubmitting?: boolean;
  highlighted?: boolean;
  defaultDurationDays?: number;
  campaignStatus?: BoostPlanCampaignStatus | null;
}) {
  const isActivePlan = campaignStatus?.status === "active";
  const isPendingPlan = campaignStatus?.status === "pending";
  const isExpiredPlan = campaignStatus?.status === "expired";
  const isAwaitingPayment = Boolean(campaignStatus?.awaitingPayment);
  const navigate = useNavigate();
  const defaultIndex = Math.max(
    0,
    plan.pricingOptions.findIndex((option) => {
      const match = option.duration.match(/^(\d+)/);
      return match ? Number(match[1]) === defaultDurationDays : false;
    }),
  );
  const [selectedOption, setSelectedOption] = useState(
    defaultDurationDays ? defaultIndex : plan.pricingOptions.length - 1,
  );

  useEffect(() => {
    if (!defaultDurationDays) return;
    const index = plan.pricingOptions.findIndex((option) => {
      const match = option.duration.match(/^(\d+)/);
      return match ? Number(match[1]) === defaultDurationDays : false;
    });
    if (index >= 0) {
      setSelectedOption(index);
    }
  }, [defaultDurationDays, plan.pricingOptions]);

  return (
    <div
      id={`boost-plan-${plan.id}`}
      className={cn(
        "relative flex flex-1 flex-col rounded-2xl p-6 transition-shadow",
        getBgClasses(plan.colorScheme),
        plan.highlighted ? "mt-5 md:mt-0" : "",
        highlighted && "ring-2 ring-brand-red ring-offset-2 shadow-lg",
        isActivePlan && !highlighted && "ring-2 ring-emerald-500 ring-offset-2 shadow-md",
        isPendingPlan && !highlighted && !isActivePlan && "ring-2 ring-amber-400 ring-offset-1",
      )}
    >
      {isActivePlan ? (
        <div className="absolute right-4 top-4 z-10">
          <span className="inline-flex rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
            Active
          </span>
        </div>
      ) : null}
      {isPendingPlan ? (
        <div className="absolute right-4 top-4 z-10">
          <span className="inline-flex rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
            Pending
          </span>
        </div>
      ) : null}
      {isExpiredPlan && !isActivePlan && !isPendingPlan ? (
        <div className="absolute right-4 top-4 z-10">
          <span className="inline-flex rounded-full bg-pink-500 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
            Expired
          </span>
        </div>
      ) : null}

      {plan.badge && !isActivePlan && !isPendingPlan ? (
        <div className="absolute -top-4 left-0 right-0 flex justify-center">
          <span className="bg-red-500 text-white text-[11px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full">
            {plan.badge}
          </span>
        </div>
      ) : null}
      <div
        className={cn(
          "flex flex-1 flex-col",
          plan.highlighted || plan.badge ? "pt-8" : "",
          (isActivePlan || isPendingPlan || isExpiredPlan) && "pt-2",
        )}
      >
        <div className="flex flex-col items-center mb-5 scale-90">
          {" "}
          <div className="relative flex items-center w-20 h-24 rounded-lg overflow-hidden">
            <div className="absolute w-14 h-6 bg-[#4A90E2] transform rotate-45 -translate-x-0 translate-y-3 rounded-sm"></div>
            <div className="absolute w-14 h-6 bg-[#357ABD] transform -rotate-45 translate-x-6 translate-y-3 rounded-sm"></div>
          </div>
          <div
            className={`w-8 h-8 rounded-full bg-gradient-to-br ${getMedalGradient(plan.colorScheme)} flex items-center justify-center text-white font-bold text-sm -mt-4 z-20 shadow-md`}
          >
            {plan.medal}
          </div>
        </div>
        <h2 className="text-center text-xl font-extrabold text-gray-900 mb-1">
          {plan.title}
        </h2>
        <p className="text-center text-gray-500 text-sm mb-2">{plan.subtitle}</p>
        {isActivePlan && campaignStatus?.durationLeftLabel ? (
          <p className="mb-4 text-center text-sm font-semibold text-emerald-700">
            {campaignStatus.durationLeftLabel} remaining · {campaignStatus.label}
          </p>
        ) : isPendingPlan ? (
          <p className="mb-4 text-center text-sm font-semibold text-amber-800">
            {campaignStatus?.label ?? "Awaiting admin approval"}
          </p>
        ) : isExpiredPlan ? (
          <p className="mb-4 text-center text-sm font-semibold text-pink-600">
            {campaignStatus?.label ?? "Campaign ended"} — boost again below
          </p>
        ) : (
          <div className="mb-5" />
        )}
        {/* Pricing Options */}
        <div className="flex flex-col gap-2 mb-4">
          {plan.pricingOptions.map((option, index) => (
            <label
              key={index}
              className={`flex items-center gap-3 bg-white border-2 rounded-xl px-4 py-2.5 cursor-pointer transition-colors ${selectedOption === index
                ? `${getRadioBorder(plan.colorScheme)} bg-gray-50`
                : "border-gray-200"
                }`}
            >
              <input
                type="radio"
                name={plan.id}
                className={`${getRadioAccent(plan.colorScheme)} w-4 h-4 shrink-0`}
                checked={selectedOption === index}
                onChange={() => setSelectedOption(index)}
              />
              <span className="text-sm font-semibold text-gray-800">
                {option.duration} –{" "}
                <span className="font-extrabold">{option.price}</span>
              </span>
            </label>
          ))}
        </div>
        {/* Slot Status */}
        <p
          className={`flex items-center gap-2 font-semibold text-sm mb-4 ${getSlotColor(plan.slotStatus)}`}
        >
          <span
            className={`w-2 h-2 rounded-full inline-block ${getSlotDotColor(plan.slotStatus)}`}
          />
          {getSlotText(plan)}
        </p>
        {/* Features */}
        <ul className="flex-1 flex flex-col gap-2 mb-6 text-sm text-gray-700">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              {feature.checked ? (
                <span className="text-green-500 font-bold">✓</span>
              ) : plan.id === "gold" && index === plan.features.length - 1 ? (
                <span className="text-yellow-500">★</span>
              ) : (
                <span className="text-gray-400 font-bold">✕</span>
              )}
              <span
                className={
                  plan.id === "gold" && index === plan.features.length - 1
                    ? "text-blue-600 font-semibold"
                    : feature.checked
                      ? ""
                      : "text-gray-400"
                }
              >
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={
            disabled ||
            isSubmitting ||
            isPendingPlan ||
            (plan.slotStatus === "occupied" && !isActivePlan && !isExpiredPlan)
          }
          onClick={() => {
            if (plan.slotStatus === "occupied" && !isActivePlan) {
              return;
            }
            const option = plan.pricingOptions[selectedOption];
            if (!option) return;

            const durationDays = Number.parseInt(option.duration, 10) || 0;
            const amount =
              durationAmounts?.[option.duration] ??
              Number(option.price.replace(/[^\d]/g, "")) ??
              0;

            if (onSelect) {
              onSelect({
                planId: plan.id,
                planTitle: plan.title,
                durationLabel: option.duration,
                durationDays,
                priceLabel: option.price,
                amount,
              });
              return;
            }

            navigate("/vendor/review-pay");
          }}
          className={cn(
            "w-full active:scale-[0.98] transition-all text-white font-bold text-sm py-3.5 rounded-xl disabled:cursor-not-allowed disabled:opacity-60",
            isActivePlan
              ? "bg-emerald-600 hover:bg-emerald-700"
              : isExpiredPlan
                ? "bg-pink-500 hover:bg-pink-600"
                : getButtonClasses(plan.colorScheme),
          )}
        >
          {isSubmitting ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Processing…
            </span>
          ) : isAwaitingPayment ? (
            "Continue Payment"
          ) : isActivePlan ? (
            "Extend Boost"
          ) : isExpiredPlan ? (
            "Boost Again"
          ) : isPendingPlan ? (
            campaignStatus?.awaitingPayment ? "Continue Payment" : "Pending approval"
          ) : (
            plan.cta
          )}
        </button>
      </div>
    </div>
  );
}
