import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { BasicBoost } from "@/components/sections/vendor/boost/BasicBoost";
import { BoostPlanBenefits } from "@/components/sections/vendor/boost/boostPlan/BoostPlanBenefits";
import {
  BoostPlanCard,
  type BoostPlanSelection,
} from "@/components/sections/vendor/boost/boostPlan/BoostPlanCard";
import { BoostPlanHeader } from "@/components/sections/vendor/boost/boostPlan/BoostPlanHeader";
import { TargetLocationCard } from "@/components/sections/vendor/boost/boostConfigure/TargetLocationCard";
import { VendorLocationBoostDetails } from "@/components/sections/vendor/shared/VendorLocationBoostDetails";
import { saveBoostCheckoutSelection } from "@/features/boost/boostCheckoutSession";
import { BoostSlotAvailabilityAlert } from "@/components/sections/vendor/boost/BoostSlotAvailabilityAlert";
import {
  isTierSlotAvailable,
  locationHasAnyBoostSlot,
  tierSlotFullMessage,
} from "@/features/boost/boostSlotAvailability";
import { buildPlansFromLocationBoost } from "@/features/boost/locationBoostPlans";
import {
  resolveCampaignStatusForTier,
  type BoostCampaignRow,
} from "@/features/boost/boostCampaignTypes";
import {
  fetchVendorBoostCatalog,
  type BoostRenewType,
} from "@/features/boost/vendorBoostApi";
import { useVendorBusinessFormOptions } from "@/features/categories/useVendorBusinessFormOptions";
import { useVendorSubscriptionAccess } from "@/hooks/useVendorSubscriptionAccess";
import { VENDOR_PREMIUM_PAYMENT_PATH } from "@/hooks/useVendorSubscriptionAccess";
import { parseVendorLocationOptions } from "@/features/locations/vendorLocationOptions";
import { showError } from "@/lib/sweetAlert";
import { cn } from "@/lib/utils";

export default function VendorBoost() {
  const navigate = useNavigate();

  const { isPremiumActive: isPremium } = useVendorSubscriptionAccess();

  const { data: catalog, isPending: catalogLoading } = useQuery({
    queryKey: ["vendor", "boost", "catalog"],
    queryFn: fetchVendorBoostCatalog,
    enabled: isPremium,
    staleTime: 30_000,
  });

  const { data: formOptions } = useVendorBusinessFormOptions();
  const parsedLocations = useMemo(
    () => parseVendorLocationOptions(formOptions?.locations),
    [formOptions?.locations],
  );

  const defaultLocationId = catalog?.location?.id ?? parsedLocations[0]?.id ?? "";
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const plansSectionRef = useRef<HTMLDivElement>(null);
  const [highlightPlanId, setHighlightPlanId] = useState<string | null>(null);
  const [renewContext, setRenewContext] = useState<{
    type: BoostRenewType;
    campaignId: number;
    tierKey: string;
    durationDays: number;
  } | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const campaigns = catalog?.campaigns ?? [];

  useEffect(() => {
    if (defaultLocationId && !selectedLocationId) {
      setSelectedLocationId(defaultLocationId);
    }
  }, [defaultLocationId, selectedLocationId]);

  const activeLocation = useMemo(() => {
    if (selectedLocationId) {
      return parsedLocations.find((entry) => entry.id === selectedLocationId) ?? catalog?.location ?? null;
    }
    return catalog?.location ?? parsedLocations[0] ?? null;
  }, [selectedLocationId, parsedLocations, catalog?.location]);

  const plans = useMemo(
    () => (activeLocation ? buildPlansFromLocationBoost(activeLocation) : []),
    [activeLocation],
  );

  const durationAmountMaps = useMemo(() => {
    const boost = activeLocation?.boost;
    if (!boost) return {} as Record<string, Record<string, number>>;

    return Object.fromEntries(
      boost.tiers.map((tier) => {
        const map: Record<string, number> = {};
        for (const days of [7, 14, 30]) {
          const tierDuration = tier.durations?.find((d) => d.days === days && d.enabled);
          const global = boost.durations.find((d) => d.days === days && d.enabled);
          const amount = tierDuration?.priceAmount || global?.priceAmount || tier.priceAmount;
          if (amount > 0) {
            map[`${days} Days`] = amount;
          }
        }
        return [tier.key, map];
      }),
    );
  }, [activeLocation?.boost]);

  const continueBoostPayment = (row: BoostCampaignRow) => {
    if (!activeLocation) {
      showError("Select a location first.");
      return;
    }

    const renewType =
      row.renew_type === "extend" || row.renew_type === "boost_again"
        ? row.renew_type
        : undefined;

    saveBoostCheckoutSelection(
      {
        locationId: activeLocation.id,
        locationLabel: activeLocation.label,
        tierKey: row.tier_key,
        tierLabel: row.tier_label,
        durationDays: row.duration_days,
        amount: row.amount,
        renewType,
        sourceCampaignId: row.source_campaign_id ?? (renewType === "extend" ? row.id : undefined),
        paymentId: row.payment_id ?? undefined,
        requestId: row.id,
      },
      { standalonePayment: true },
    );
    navigate("/vendor/review-pay");
  };

  const goToBoostPayment = (checkout: {
    tierKey: string;
    tierLabel: string;
    durationDays: number;
    amount: number;
    renewType?: BoostRenewType;
    sourceCampaignId?: number;
  }) => {
    if (!activeLocation) {
      showError("Select a location first.");
      return;
    }

    if (catalog?.pendingRequest?.status === "pending_admin" && !checkout.renewType) {
      showError("You already have a boost request awaiting admin approval.");
      return;
    }

    const existingUnpaid = campaigns.find((campaign) => {
      if (!campaign.can_continue_payment) return false;
      if (!checkout.renewType) {
        return (
          campaign.tier_key === checkout.tierKey &&
          !campaign.renew_type &&
          campaign.duration_days === checkout.durationDays
        );
      }
      return (
        campaign.renew_type === checkout.renewType &&
        (checkout.renewType !== "extend" ||
          campaign.source_campaign_id === checkout.sourceCampaignId)
      );
    });

    if (existingUnpaid) {
      continueBoostPayment(existingUnpaid);
      return;
    }

    setIsCheckingOut(true);
    saveBoostCheckoutSelection(
      {
        locationId: activeLocation.id,
        locationLabel: activeLocation.label,
        tierKey: checkout.tierKey,
        tierLabel: checkout.tierLabel,
        durationDays: checkout.durationDays,
        amount: checkout.amount,
        renewType: checkout.renewType,
        sourceCampaignId: checkout.sourceCampaignId,
      },
      { standalonePayment: true },
    );
    navigate("/vendor/review-pay");
  };

  const startRenewFlow = (row: BoostCampaignRow, type: BoostRenewType) => {
    if (row.can_continue_payment) {
      continueBoostPayment(row);
      return;
    }

    const unpaidExtend = campaigns.find(
      (campaign) =>
        campaign.can_continue_payment &&
        campaign.renew_type === type &&
        (type !== "extend" || campaign.source_campaign_id === row.id),
    );

    if (unpaidExtend) {
      continueBoostPayment(unpaidExtend);
      return;
    }

    goToBoostPayment({
      tierKey: row.tier_key,
      tierLabel: row.tier_label,
      durationDays: row.duration_days,
      amount: row.amount,
      renewType: type,
      sourceCampaignId: row.id,
    });
  };

  const handlePlanSelect = (selection: BoostPlanSelection) => {
    if (!activeLocation) {
      showError("Select a location first.");
      return;
    }

    if (!locationHasAnyBoostSlot(activeLocation)) {
      showError(
        `No boost slots are available for ${activeLocation.label}. All spots are currently booked.`,
      );
      return;
    }

    const tier = activeLocation.boost?.tiers.find((t) => t.key === selection.planId);
    if (tier && !isTierSlotAvailable(tier)) {
      showError(tierSlotFullMessage(tier, activeLocation));
      return;
    }

    if (!selection.durationDays || selection.durationDays <= 0) {
      showError("Please select a duration (7, 14, or 30 days) on the card before continuing.");
      return;
    }

    if (!catalog?.isPremiumActive) {
      saveBoostCheckoutSelection(
        {
          locationId: activeLocation.id,
          locationLabel: activeLocation.label,
          tierKey: selection.planId,
          tierLabel: selection.planTitle,
          durationDays: selection.durationDays,
          amount: selection.amount,
        },
        { bundledWithPremium: true },
      );
      navigate(VENDOR_PREMIUM_PAYMENT_PATH);
      return;
    }

    if (catalog.pendingRequest?.status === "pending_admin" && !renewContext) {
      showError("You already have a boost request awaiting admin approval.");
      return;
    }

    if (renewContext) {
      if (selection.planId !== renewContext.tierKey) {
        showError(`Please use the ${renewContext.tierKey.replace("_", " ")} plan card for this action.`);
        return;
      }

      goToBoostPayment({
        tierKey: selection.planId,
        tierLabel: selection.planTitle,
        durationDays: selection.durationDays,
        amount: selection.amount,
        renewType: renewContext.type,
        sourceCampaignId: renewContext.campaignId,
      });
      return;
    }

    const activeRow = campaigns.find(
      (row) => row.tier_key === selection.planId && row.display_status === "active",
    );
    if (activeRow) {
      const unpaidExtend = campaigns.find(
        (row) =>
          row.can_continue_payment &&
          row.renew_type === "extend" &&
          row.source_campaign_id === activeRow.id,
      );
      if (unpaidExtend) {
        continueBoostPayment(unpaidExtend);
        return;
      }

      goToBoostPayment({
        tierKey: selection.planId,
        tierLabel: selection.planTitle,
        durationDays: selection.durationDays,
        amount: selection.amount,
        renewType: "extend",
        sourceCampaignId: activeRow.id,
      });
      return;
    }

    const expiredRow = campaigns.find(
      (row) => row.tier_key === selection.planId && row.display_status === "expired",
    );
    if (expiredRow) {
      const unpaidAgain = campaigns.find(
        (row) => row.can_continue_payment && row.renew_type === "boost_again",
      );
      if (unpaidAgain) {
        continueBoostPayment(unpaidAgain);
        return;
      }

      goToBoostPayment({
        tierKey: selection.planId,
        tierLabel: selection.planTitle,
        durationDays: selection.durationDays,
        amount: selection.amount,
        renewType: "boost_again",
        sourceCampaignId: expiredRow.id,
      });
      return;
    }

    const unpaidTier = campaigns.find(
      (row) => row.tier_key === selection.planId && row.can_continue_payment,
    );
    if (unpaidTier) {
      continueBoostPayment(unpaidTier);
      return;
    }

    goToBoostPayment({
      tierKey: selection.planId,
      tierLabel: selection.planTitle,
      durationDays: selection.durationDays,
      amount: selection.amount,
    });
  };

  return (
    <div className={cn("p-4", "md:p-6")}>
      <section className="space-y-5">
        {isPremium ? (
          <>
            <BoostPlanHeader />

            <TargetLocationCard
              location={activeLocation}
              locations={parsedLocations}
              selectedLocationId={selectedLocationId || activeLocation?.id || ""}
              onLocationChange={setSelectedLocationId}
              readOnly={false}
            />

            {activeLocation && activeLocation.boost?.enabled ? (
              <p className="text-xs text-muted-foreground">
                Showing boost plans for{" "}
                <span className="font-semibold text-foreground">{activeLocation.label}</span>
              </p>
            ) : null}

            {catalog?.pendingRequest?.can_continue_payment ? (
              <p className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                Payment not completed for {catalog.pendingRequest.tier_label} ({catalog.pendingRequest.duration_days}{" "}
                days). Complete payment to send the extend request to admin.
                <button
                  type="button"
                  className="ml-2 font-semibold underline"
                  onClick={() => {
                    const pending = catalog.pendingRequest;
                    if (!pending) return;

                    const row =
                      campaigns.find((c) => c.id === pending.id) ??
                      ({
                        id: pending.id,
                        tier_key: pending.tier_key,
                        tier_label: pending.tier_label,
                        duration_days: pending.duration_days,
                        amount: pending.amount,
                        can_continue_payment: true,
                        payment_id: pending.payment_id,
                        renew_type: pending.renew_type,
                      } as BoostCampaignRow);

                    continueBoostPayment(row);
                  }}
                >
                  Continue Payment
                </button>
              </p>
            ) : catalog?.pendingRequest?.status === "pending_admin" ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {catalog.pendingRequest.status_label}: {catalog.pendingRequest.tier_label} (
                {catalog.pendingRequest.duration_days} days) — waiting for admin approval before activation.
              </p>
            ) : null}

            {renewContext ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                {renewContext.type === "extend" ? "Extending" : "Boosting again"}:{" "}
                <span className="font-semibold">{renewContext.tierKey.replace(/_/g, " ")}</span> — pick a
                duration on the highlighted plan below and confirm.
                <button
                  type="button"
                  className="ml-2 font-semibold underline"
                  onClick={() => {
                    setRenewContext(null);
                    setHighlightPlanId(null);
                  }}
                >
                  Cancel
                </button>
              </p>
            ) : null}

            {activeLocation?.boost?.enabled ? (
              <BoostSlotAvailabilityAlert location={activeLocation} />
            ) : null}

            {catalogLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="size-8 animate-spin text-brand-red" aria-label="Loading boost plans" />
              </div>
            ) : activeLocation && !activeLocation.boost?.enabled ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-sm text-muted-foreground">
                Boost is not configured for {activeLocation.label} yet. Ask an admin to enable LGA boost
                slots for this area.
                <VendorLocationBoostDetails location={activeLocation} readOnly />
              </div>
            ) : plans.length > 0 ? (
              <div ref={plansSectionRef} className={cn("grid", "gap-8", "xl:grid-cols-3")}>
                {plans.map((boostPlan) => (
                  <BoostPlanCard
                    key={`${activeLocation?.id}-${boostPlan.id}`}
                    plan={boostPlan}
                    durationAmounts={durationAmountMaps[boostPlan.id]}
                    campaignStatus={resolveCampaignStatusForTier(
                      boostPlan.id,
                      campaigns,
                      catalog?.pendingRequest,
                    )}
                    onSelect={handlePlanSelect}
                    isSubmitting={isCheckingOut}
                    highlighted={highlightPlanId === boostPlan.id}
                    defaultDurationDays={
                      renewContext?.tierKey === boostPlan.id ? renewContext.durationDays : undefined
                    }
                    disabled={
                      isCheckingOut ||
                      (catalog?.pendingRequest?.status === "pending_admin" && !renewContext) ||
                      (!renewContext &&
                        !locationHasAnyBoostSlot(activeLocation) &&
                        boostPlan.slotStatus === "occupied") ||
                      (renewContext !== null &&
                        renewContext.tierKey !== boostPlan.id) ||
                      (boostPlan.slotStatus === "occupied" &&
                        renewContext?.tierKey !== boostPlan.id)
                    }
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No boost plans available for this location.</p>
            )}

            <BoostPlanBenefits
              campaigns={campaigns}
              loading={catalogLoading}
              onExtendBoost={(row) => startRenewFlow(row, "extend")}
              onBoostAgain={(row) => startRenewFlow(row, "boost_again")}
              onContinuePayment={continueBoostPayment}
            />
          </>
        ) : (
          <BasicBoost previewLocation={parsedLocations[0] ?? null} />
        )}
      </section>
    </div>
  );
}
