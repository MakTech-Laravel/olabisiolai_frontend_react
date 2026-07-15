import { useCallback, useEffect, useState } from "react";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import { Loader2 } from "lucide-react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { showError, showSuccess } from "@/lib/sweetAlert";
import { fetchUserWallet } from "@/api/wallet";

import { useAuth } from "@/auth/useAuth";
import { getAccessToken } from "@/auth/token";
import { hasAnyRole } from "@/auth/roles";
import type { BillingFormValues } from "@/components/sections/vendor/boost/boostPay/BillingInformationCard";
import { BoostPayHeader } from "@/components/sections/vendor/boost/boostPay/BoostPayHeader";
import { OrderSummaryCard } from "@/components/sections/vendor/boost/boostPay/OrderSummaryCard";
import { PaymentMethodsCard, type CheckoutGateway } from "@/components/sections/vendor/boost/boostPay/PaymentMethodsCard";
import { WalletApplySection } from "@/components/sections/vendor/boost/boostPay/WalletApplySection";
import { SavedCheckoutProfilesCard } from "@/components/sections/vendor/boost/boostPay/SavedCheckoutProfilesCard";
import { env } from "@/config/env";
import { formatNaira } from "@/lib/currency";
import {
  extractFlutterwaveTransactionId,
  isFlutterwavePaymentSuccessful,
  type FlutterwaveCallbackResponse,
} from "@/features/payments/flutterwaveResponse";
import { openPaystackCheckout } from "@/features/payments/openPaystackCheckout";
import {
  readBoostCheckoutSelection,
  readPremiumBundledBoostSelection,
  clearBoostCheckoutSelection,
  type BoostCheckoutSelection,
} from "@/features/boost/boostCheckoutSession";
import { primeVendorSubscriptionCaches } from "@/features/subscription/primeVendorSubscriptionCaches";
import {
  confirmSubscriptionPayment,
  fetchSubscriptionPackages,
  fetchSubscriptionStatus,
  initSubscriptionPayment,
  reconcileSubscriptionPayment,
  resumeSubscriptionPayment,
  type SubscriptionCheckoutInit,
  type SubscriptionPayment,
  type VendorSubscriptionState,
} from "@/features/subscription/vendorSubscriptionApi";
import { getLaravelErrorMessage } from "@/lib/laravelApiError";
import { profileNeedsEmailVerification } from "@/api/userEmailVerification";
import { fetchVendorSettings } from "@/api/vendorSettings";
import { fetchVendorBusinessProfile } from "@/features/business/vendorBusinessProfileApi";
import { businessProfilePath } from "@/lib/businessProfile";
import { PurchaseEmailVerificationBlock } from "@/components/settings/PurchaseEmailVerificationBlock";
import { PaystackEmailQuickSet } from "@/components/settings/PaystackEmailQuickSet";
import { billingFromUser, billingFromVendorPaymentMethod } from "@/features/vendor/vendorBillingProfile";
import { fetchVendorPaymentMethods } from "@/features/vendor/vendorPaymentsApi";
import type { VendorPaymentMethod } from "@/features/vendor/vendorPaymentsApi";

const CHECKOUT_SESSION_KEY = "subscriptionCheckoutJson";

function parsePaymentRecord(raw: unknown): SubscriptionPayment | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = typeof row.id === "number" ? row.id : Number(row.id);
  const amount = typeof row.amount === "number" ? row.amount : Number(row.amount);
  if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(amount)) {
    return null;
  }
  return {
    ...(row as SubscriptionPayment),
    id,
    amount,
  };
}

function normalizeCheckout(raw: unknown): SubscriptionCheckoutInit | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const paymentsBlock =
    data.payments && typeof data.payments === "object"
      ? (data.payments as Record<string, unknown>)
      : null;

  const subscription =
    parsePaymentRecord(paymentsBlock?.subscription) ??
    parsePaymentRecord(data.payment) ??
    parsePaymentRecord(raw);

  if (!subscription) {
    return null;
  }

  const boost = parsePaymentRecord(paymentsBlock?.boost);
  const totalRaw = data.total_amount ?? subscription.amount + (boost?.amount ?? 0);
  const total_amount = typeof totalRaw === "number" ? totalRaw : Number(totalRaw);
  const gatewayRaw = data.gateway_amount;
  const gateway_amount =
    gatewayRaw !== undefined && gatewayRaw !== null
      ? typeof gatewayRaw === "number"
        ? gatewayRaw
        : Number(gatewayRaw)
      : undefined;
  const walletRaw = data.wallet_applied;
  const wallet_applied =
    walletRaw !== undefined && walletRaw !== null
      ? typeof walletRaw === "number"
        ? walletRaw
        : Number(walletRaw)
      : undefined;
  const accessCodeRaw = data.paystack_access_code;
  const paystack_access_code =
    typeof accessCodeRaw === "string" && accessCodeRaw.trim() !== "" ? accessCodeRaw.trim() : undefined;

  return {
    payment: parsePaymentRecord(data.payment) ?? subscription,
    payments: { subscription, boost },
    total_amount: Number.isFinite(total_amount) ? total_amount : subscription.amount,
    gateway_amount: gateway_amount !== undefined && Number.isFinite(gateway_amount) ? gateway_amount : undefined,
    wallet_applied: wallet_applied !== undefined && Number.isFinite(wallet_applied) ? wallet_applied : undefined,
    paystack_access_code,
    currency: String(data.currency ?? subscription.currency ?? "NGN"),
    paidFromWallet: Boolean((raw as Record<string, unknown>).paid_from_wallet ?? (data as Record<string, unknown>).paid_from_wallet),
    subscription: (data as { subscription?: VendorSubscriptionState }).subscription,
  };
}

function resolveSubscriptionPaymentId(checkout: SubscriptionCheckoutInit): number {
  const id = checkout.payments.subscription.id;
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Checkout is missing a valid payment id. Please try Pay again.");
  }
  return id;
}

async function loadFreshSubscriptionCheckout(
  boost?: { tierKey: string; durationDays: number; budgetAmount?: number },
  packageKey?: string,
): Promise<SubscriptionCheckoutInit> {
  try {
    const resumed = normalizeCheckout(await resumeSubscriptionPayment());
    if (resumed) {
      return resumed;
    }
  } catch {
    // fall through to new checkout
  }

  const created = normalizeCheckout(
    await initSubscriptionPayment({
      gateway: "flutterwave",
      boost,
      packageKey,
    }),
  );
  if (!created) {
    throw new Error("Unable to prepare premium checkout.");
  }
  return created;
}

function subscriptionBoostPayload(
  selection: BoostCheckoutSelection | null,
): { tierKey: string; durationDays: number; budgetAmount?: number } | undefined {
  if (!selection) return undefined;

  return {
    tierKey: selection.tierKey,
    durationDays: selection.durationDays,
    budgetAmount: selection.budgetAmount ?? selection.amount,
  };
}

function readCheckoutFromSession(): SubscriptionCheckoutInit | null {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_SESSION_KEY);
    if (!raw) return null;
    return normalizeCheckout(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeCheckoutToSession(checkout: SubscriptionCheckoutInit | null) {
  if (!checkout) {
    sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
    return;
  }
  sessionStorage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify(checkout));
}

export default function VendorSubscriptionPayPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scopedBusinessId = Number(searchParams.get("business_id")) || undefined;
  const packageKeyFromUrl = searchParams.get("package_key") || undefined;
  const queryClient = useQueryClient();
  const [selectedGateway, setSelectedGateway] = useState<CheckoutGateway>("paystack");
  const [applyWallet, setApplyWallet] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [checkout, setCheckout] = useState<SubscriptionCheckoutInit | null>(() => readCheckoutFromSession());
  const [shouldOpenFlutterwave, setShouldOpenFlutterwave] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [billing, setBilling] = useState<BillingFormValues>(() => billingFromUser(null));
  const [profileInitDone, setProfileInitDone] = useState(false);
  const [paystackRetryReference, setPaystackRetryReference] = useState("");
  const [isReconciling, setIsReconciling] = useState(false);

  const { user, isAuthenticated, isSessionLoading, isUserLoading } = useAuth();
  const hasToken = Boolean(getAccessToken());
  const canFetchPackages = isAuthenticated || hasToken;

  const { data: packagesData, isPending: packagesLoading, isError: packagesError } = useQuery({
    queryKey: ["vendor", "subscription", "packages"],
    queryFn: fetchSubscriptionPackages,
    enabled: canFetchPackages,
    retry: 1,
  });

  const { data: methodsData } = useQuery({
    queryKey: ["vendor", "payment-methods"],
    queryFn: fetchVendorPaymentMethods,
    enabled: canFetchPackages,
    staleTime: 30_000,
  });

  const { data: subscriptionStatus } = useQuery({
    queryKey: ["vendor", "subscription", "status", scopedBusinessId],
    queryFn: () => fetchSubscriptionStatus({ businessId: scopedBusinessId }),
    enabled: canFetchPackages,
    retry: 1,
  });

  const { data: vendorSettings } = useQuery({
    queryKey: ["vendor", "settings"],
    queryFn: fetchVendorSettings,
    enabled: canFetchPackages,
    staleTime: 30_000,
  });

  const { data: walletData } = useQuery({
    queryKey: ["user", "wallet"],
    queryFn: fetchUserWallet,
    enabled: canFetchPackages,
    staleTime: 15_000,
  });

  const { data: ownerBusiness } = useQuery({
    queryKey: ["vendor", "business", "profile"],
    queryFn: fetchVendorBusinessProfile,
    enabled: canFetchPackages,
    retry: false,
  });

  const ownerBusinessPath = ownerBusiness?.id
    ? businessProfilePath(ownerBusiness.id)
    : "/user/profile";

  const emailVerificationProfile = vendorSettings?.profile ?? user;
  const purchaseBlockedByEmail = profileNeedsEmailVerification(emailVerificationProfile);
  const paystackNeedsEmailVerification =
    selectedGateway === "paystack" && !emailVerificationProfile?.email;

  const [boostSelection, setBoostSelection] = useState(() => readPremiumBundledBoostSelection());

  useEffect(() => {
    const stored = readBoostCheckoutSelection();
    if (stored && !stored.bundledWithPremium) {
      clearBoostCheckoutSelection();
    }
    setBoostSelection(readPremiumBundledBoostSelection());
  }, []);
  const [selectedPackageKey, setSelectedPackageKey] = useState<string | null>(packageKeyFromUrl ?? null);
  const packages = packagesData?.packages ?? [];
  const premiumPackage =
    packages.find((p) => p.id === selectedPackageKey) ??
    packages.find((p) => p.is_recommended) ??
    packages[0];
  const premiumBase = premiumPackage?.amount ?? 0;
  const boostAddon = boostSelection?.amount ?? 0;
  const subscriptionLine = checkout?.payments.subscription ?? checkout?.payment ?? null;
  const boostLinePayment = checkout?.payments.boost ?? null;
  const subtotalNgn =
    checkout?.total_amount ??
    (subscriptionLine?.amount ?? premiumBase) + (boostLinePayment?.amount ?? boostAddon);
  const estimatedWalletApplied = applyWallet
    ? Math.min(walletData?.balance ?? 0, subtotalNgn)
    : 0;
  const walletAppliedAmount = applyWallet ? (checkout?.wallet_applied ?? estimatedWalletApplied) : 0;
  const amountNgn = applyWallet
    ? (checkout?.gateway_amount ?? Math.max(0, subtotalNgn - estimatedWalletApplied))
    : subtotalNgn;

  useEffect(() => {
    if (profileInitDone) return;
    if (!methodsData?.items) return;
    setProfileInitDone(true);
    const def = methodsData.items.find((x) => x.is_default) ?? methodsData.items[0];
    if (def) {
      setSelectedProfileId(def.id);
      setBilling(billingFromVendorPaymentMethod(def));
    }
  }, [methodsData, profileInitDone]);

  useEffect(() => {
    if (!profileInitDone) return;
    if (selectedProfileId !== null) return;
    setBilling(billingFromUser(user));
  }, [user, profileInitDone, selectedProfileId]);

  const customerEmail = billing.email.trim() || user?.email || "guest@gidira.app";
  const customerPhone = billing.phone.trim() || "08000000000";
  const customerName = billing.cardholder_name.trim() || "Gidira Vendor";

  const flutterAmount = checkout?.gateway_amount ?? amountNgn;
  const flutterCurrency = checkout?.currency ?? subscriptionLine?.currency ?? "NGN";
  const flutterTxRef =
    subscriptionLine?.tx_ref ?? `subscription_pending_${String(user?.id ?? "guest")}`;

  const handleFlutterPayment = useFlutterwave({
    public_key: env.flutterwavePublicKey ?? "",
    tx_ref: flutterTxRef,
    amount: flutterAmount,
    currency: flutterCurrency,
    payment_options: "card",
    customer: {
      email: customerEmail,
      phone_number: customerPhone,
      name: customerName,
    },
    customizations: {
      title: "Gidira Premium Subscription",
      description: premiumPackage?.title ?? "Premium subscription",
      logo: "/favicon.svg",
    },
  });

  const persistCheckout = useCallback((init: SubscriptionCheckoutInit | null) => {
    const normalized = init ? normalizeCheckout(init) : null;
    setCheckout(normalized);
    writeCheckoutToSession(normalized);
  }, []);

  const openPaystack = useCallback(
    async (freshCheckout: SubscriptionCheckoutInit) => {
      const paymentId = resolveSubscriptionPaymentId(freshCheckout);
      const payableAmount = freshCheckout.gateway_amount ?? freshCheckout.total_amount ?? amountNgn;

      await openPaystackCheckout({
        email: customerEmail,
        amountNgn: payableAmount,
        currency: freshCheckout.currency ?? flutterCurrency,
        reference: freshCheckout.payments.subscription.tx_ref ?? flutterTxRef,
        accessCode: freshCheckout.paystack_access_code,
        requireAccessCode: true,
        customerName,
        customerPhone,
        onClose: () => setIsPaying(false),
        onError: (message) => {
          setIsPaying(false);
          showError(message);
        },
        onSuccess: async (paystackRef) => {
          try {
            if (!paystackRef) {
              showError("Payment completed but Paystack reference was missing.");
              return;
            }

            let result;
            try {
              result = await confirmSubscriptionPayment(paymentId, paystackRef, "paystack");
            } catch {
              result = await reconcileSubscriptionPayment(paystackRef, {
                businessId: scopedBusinessId,
              });
            }

            persistCheckout(null);
            clearBoostCheckoutSelection();

            if (result.subscription.is_premium_active) {
              localStorage.setItem("vendorPlan", "premium");
            } else {
              localStorage.removeItem("vendorPlan");
            }
            localStorage.setItem("vendorBusinessCreated", "true");
            primeVendorSubscriptionCaches(queryClient, result.subscription);

            navigate(ownerBusinessPath, { replace: true });
            showSuccess(result.message || "Premium subscription activated successfully.");

            void queryClient.invalidateQueries({ queryKey: ["vendor"] });
            void queryClient.invalidateQueries({ queryKey: ["vendor", "onboarding", "status"] });
            void queryClient.invalidateQueries({ queryKey: ["vendor", "subscription", "status"] });
            void queryClient.invalidateQueries({ queryKey: ["vendor", "payments"] });
          } catch (error) {
            showError(
              getLaravelErrorMessage(
                error,
                "Payment succeeded but premium activation failed. Use “Already paid?” below to activate with your Paystack reference.",
              ),
            );
          } finally {
            setIsPaying(false);
          }
        },
      });
    },
    [
      amountNgn,
      customerEmail,
      customerName,
      customerPhone,
      flutterCurrency,
      flutterTxRef,
      navigate,
      ownerBusinessPath,
      persistCheckout,
      queryClient,
      scopedBusinessId,
    ],
  );

  useEffect(() => {
    const sub = subscriptionStatus?.subscription;
    if (!sub) {
      return;
    }

    // Free plan + saved checkout from an old session causes "payment id is invalid".
    if (sub.plan === "free" && sub.is_premium_active !== true && checkout) {
      persistCheckout(null);
    }
  }, [checkout, persistCheckout, subscriptionStatus]);

  useEffect(() => {
    if (!canFetchPackages || checkout) {
      return;
    }

    const requiresPayment = subscriptionStatus?.subscription?.requires_payment === true;
    const isPremiumActive = subscriptionStatus?.subscription?.is_premium_active === true;

    if (isPremiumActive || !requiresPayment) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const resumed = normalizeCheckout(await resumeSubscriptionPayment());
        if (!cancelled && resumed) {
          persistCheckout(resumed);
        }
      } catch {
        // No pending payment yet — checkout will be created on Pay.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canFetchPackages, checkout, persistCheckout, subscriptionStatus]);

  useEffect(() => {
    if (!shouldOpenFlutterwave || !checkout) {
      return;
    }

    setShouldOpenFlutterwave(false);
    let resolvedPaymentId: number;
    try {
      resolvedPaymentId = resolveSubscriptionPaymentId(checkout);
    } catch (error) {
      setIsPaying(false);
      persistCheckout(null);
      showError(getLaravelErrorMessage(error, "Checkout expired. Please tap Pay again."));
      return;
    }

    handleFlutterPayment({
      callback: async (response: FlutterwaveCallbackResponse) => {
        try {
          if (!isFlutterwavePaymentSuccessful(response)) {
            showError("Payment was not completed. Please try again.");
            return;
          }

          const txId = extractFlutterwaveTransactionId(response);
          if (!txId) {
            showError("Payment completed but transaction id was missing.");
            return;
          }

          let paymentId = resolvedPaymentId;
          try {
            paymentId = resolveSubscriptionPaymentId(checkout);
          } catch {
            const fresh = await loadFreshSubscriptionCheckout(
              subscriptionBoostPayload(boostSelection),
              premiumPackage?.id,
            );
            persistCheckout(fresh);
            paymentId = resolveSubscriptionPaymentId(fresh);
          }

          const result = await confirmSubscriptionPayment(paymentId, String(txId), "flutterwave");

          closePaymentModal();
          persistCheckout(null);
          clearBoostCheckoutSelection();

          if (result.subscription.is_premium_active) {
            localStorage.setItem("vendorPlan", "premium");
          } else {
            localStorage.removeItem("vendorPlan");
          }
          localStorage.setItem("vendorBusinessCreated", "true");
          primeVendorSubscriptionCaches(queryClient, result.subscription);

          navigate(ownerBusinessPath, { replace: true });
          showSuccess(result.message || "Premium subscription activated successfully.");

          void queryClient.invalidateQueries({ queryKey: ["vendor"] });
          void queryClient.invalidateQueries({ queryKey: ["vendor", "onboarding", "status"] });
          void queryClient.invalidateQueries({ queryKey: ["vendor", "subscription", "status"] });
          void queryClient.invalidateQueries({ queryKey: ["vendor", "payments"] });
        } catch (error) {
          persistCheckout(null);
          showError(
            getLaravelErrorMessage(
              error,
              "Payment succeeded but premium activation failed. Tap Pay again on this page to retry activation.",
            ),
          );
        } finally {
          setIsPaying(false);
        }
      },
      onClose: () => setIsPaying(false),
    });
  }, [
    shouldOpenFlutterwave,
    checkout,
    boostSelection,
    handleFlutterPayment,
    navigate,
    persistCheckout,
    premiumPackage?.id,
    queryClient,
  ]);

  const onRemoveBoostAddon = () => {
    clearBoostCheckoutSelection();
    setBoostSelection(null);
    persistCheckout(null);
  };

  const onReconcilePaid = async () => {
    const reference = paystackRetryReference.trim() || subscriptionLine?.tx_ref?.trim() || "";
    if (!reference) {
      showError("Enter the Paystack reference from your receipt or bank alert.");
      return;
    }

    try {
      setIsReconciling(true);
      const result = await reconcileSubscriptionPayment(reference, {
        businessId: scopedBusinessId,
      });
      persistCheckout(null);
      clearBoostCheckoutSelection();

      if (result.subscription.is_premium_active) {
        localStorage.setItem("vendorPlan", "premium");
      } else {
        localStorage.removeItem("vendorPlan");
      }
      localStorage.setItem("vendorBusinessCreated", "true");
      primeVendorSubscriptionCaches(queryClient, result.subscription);

      navigate(ownerBusinessPath, { replace: true });
      showSuccess(result.message || "Premium subscription activated successfully.");

      void queryClient.invalidateQueries({ queryKey: ["vendor"] });
    } catch (error) {
      showError(getLaravelErrorMessage(error, "Could not activate premium. Contact support with your Paystack reference."));
    } finally {
      setIsReconciling(false);
    }
  };

  const onConfirmPay = async () => {
    if (purchaseBlockedByEmail) {
      showError("Verify your email in Settings before making a purchase.");
      return;
    }

    if (paystackNeedsEmailVerification) {
      showError("Add and verify your email above to pay with Paystack.");
      return;
    }

    try {
      setIsPaying(true);

      const initResult = await initSubscriptionPayment({
        gateway: selectedGateway,
        applyWallet,
        businessId: scopedBusinessId,
        boost: subscriptionBoostPayload(boostSelection),
        packageKey: premiumPackage?.id,
      });

      if (initResult.paidFromWallet && initResult.subscription) {
        persistCheckout(null);
        clearBoostCheckoutSelection();

        if (initResult.subscription.is_premium_active) {
          localStorage.setItem("vendorPlan", "premium");
        } else {
          localStorage.removeItem("vendorPlan");
        }
        localStorage.setItem("vendorBusinessCreated", "true");
        primeVendorSubscriptionCaches(queryClient, initResult.subscription);

        navigate(ownerBusinessPath, { replace: true });
        showSuccess("Premium subscription activated successfully.");

        void queryClient.invalidateQueries({ queryKey: ["vendor"] });
        void queryClient.invalidateQueries({ queryKey: ["vendor", "onboarding", "status"] });
        void queryClient.invalidateQueries({ queryKey: ["vendor", "subscription", "status"] });
        void queryClient.invalidateQueries({ queryKey: ["vendor", "payments"] });
        void queryClient.invalidateQueries({ queryKey: ["user", "wallet"] });
        setIsPaying(false);
        return;
      }

      const fresh = normalizeCheckout(initResult);

      if (!fresh) {
        throw new Error("Unable to prepare premium checkout.");
      }

      const checkoutInit = fresh;
      persistCheckout(checkoutInit);

      const payableAmount = checkoutInit.gateway_amount ?? checkoutInit.total_amount ?? amountNgn;
      if (payableAmount <= 0) {
        throw new Error("Nothing left to pay for this checkout.");
      }

      if (selectedGateway === "flutterwave" && !env.flutterwavePublicKey) {
        showError("Flutterwave public key is missing. Set VITE_FLUTTERWAVE_PUBLIC_KEY.");
        setIsPaying(false);
        return;
      }
      if (selectedGateway === "paystack" && !env.paystackPublicKey) {
        showError("Paystack public key is missing. Set VITE_PAYSTACK_PUBLIC_KEY.");
        setIsPaying(false);
        return;
      }

      if (selectedGateway === "flutterwave") {
        setShouldOpenFlutterwave(true);
      } else {
        void openPaystack(checkoutInit);
      }
    } catch (error) {
      setIsPaying(false);
      showError(getLaravelErrorMessage(error, "Unable to start payment."));
    }
  };

  const onSelectProfile = (_id: number | null, method: VendorPaymentMethod | null) => {
    setSelectedProfileId(_id);
    if (method) {
      setBilling(billingFromVendorPaymentMethod(method));
    } else {
      setBilling(billingFromUser(user));
    }
  };

  if (isSessionLoading || (isUserLoading && !user && hasToken)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-brand-red" aria-label="Loading checkout" />
      </div>
    );
  }

  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" replace state={{ from: "/vendor/premium-payment" }} />;
  }

  if (user && !hasAnyRole(user, "vendor")) {
    return <Navigate to="/unauthorized" replace />;
  }

  const methods = methodsData?.items ?? [];

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="space-y-4">
        <BoostPayHeader variant="subscription" backTo={ownerBusinessPath} />

        <PurchaseEmailVerificationBlock profile={emailVerificationProfile} />

        {packagesError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Could not load premium package details. You can still pay {formatNaira(amountNgn, { freeLabel: false })} below.
          </p>
        ) : null}

        <div className="mt-10 grid gap-4 xl:grid-cols-[1fr_390px]">
          <div className="space-y-4">
            {packages.length > 1 ? (
              <div className="rounded-2xl border border-border-light bg-card p-4 shadow-sm">
                <p className="mb-3 text-sm font-semibold text-foreground">Choose a plan</p>
                <div className="space-y-2">
                  {packages.map((pkg) => (
                    <label
                      key={pkg.id}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                        premiumPackage?.id === pkg.id
                          ? "border-brand-red bg-brand-red/5"
                          : "border-border-light hover:bg-muted/40"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="premium-plan"
                          checked={premiumPackage?.id === pkg.id}
                          onChange={() => {
                            setSelectedPackageKey(pkg.id);
                            persistCheckout(null);
                          }}
                          className="size-4"
                        />
                        <span className="font-medium">{pkg.title}</span>
                        {pkg.is_recommended ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            Recommended
                          </span>
                        ) : null}
                      </span>
                      <span className="font-semibold">{formatNaira(pkg.amount, { freeLabel: false })}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            <PaymentMethodsCard
              selectedGateway={selectedGateway}
              onGatewayChange={setSelectedGateway}
            />
            <SavedCheckoutProfilesCard
              items={methods}
              selectedId={selectedProfileId}
              onSelect={onSelectProfile}
            />
          </div>

          <OrderSummaryCard
            onConfirmPay={() => void onConfirmPay()}
            isPaying={isPaying || packagesLoading || purchaseBlockedByEmail || paystackNeedsEmailVerification}
            planTitle={premiumPackage?.title ?? "Premium"}
            subtotalAmount={subtotalNgn}
            walletApplied={walletAppliedAmount}
            totalAmount={amountNgn}
            boostLine={
              boostLinePayment && boostLinePayment.amount > 0
                ? {
                  label:
                    boostSelection
                      ? `${boostSelection.tierLabel} · ${boostSelection.durationDays} days`
                      : "Boost campaign",
                  amount: boostLinePayment.amount,
                  dailyBudget: boostSelection?.budgetAmount,
                  durationDays: boostSelection?.durationDays,
                }
                : boostSelection
                  ? {
                    label: `${boostSelection.tierLabel} · ${boostSelection.durationDays} days`,
                    amount: boostSelection.amount,
                    dailyBudget: boostSelection.budgetAmount,
                    durationDays: boostSelection.durationDays,
                  }
                  : null
            }
            isVerification={false}
            beforePayButton={
              <div className="space-y-2">
                <WalletApplySection
                  subtotal={subtotalNgn}
                  applyWallet={applyWallet}
                  walletApplied={walletAppliedAmount}
                  onApplyWalletChange={(next) => {
                    setApplyWallet(next);
                    persistCheckout(null);
                  }}
                />
                {paystackNeedsEmailVerification ? (
                  <PaystackEmailQuickSet
                    settingsQueryKey={["vendor", "settings"]}
                    onSaved={() => {
                      void queryClient.invalidateQueries({ queryKey: ["vendor", "settings"] });
                    }}
                  />
                ) : null}
                {boostSelection ? (
                  <button
                    type="button"
                    className="text-xs font-semibold text-brand-red underline"
                    onClick={onRemoveBoostAddon}
                  >
                    Remove boost add-on (pay premium only)
                  </button>
                ) : null}
              </div>
            }
          />
        </div>

        {subscriptionStatus?.subscription?.requires_payment ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 md:p-5">
            <h2 className="text-base font-semibold text-amber-950">Already paid on Paystack?</h2>
            <p className="mt-1 text-sm text-amber-900">
              If money was deducted but premium is not active, paste the Paystack reference from your
              receipt or bank alert below.
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={paystackRetryReference}
                onChange={(e) => setPaystackRetryReference(e.target.value)}
                placeholder="Paystack receipt reference"
                className="min-w-0 flex-1 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={isReconciling || purchaseBlockedByEmail}
                onClick={() => void onReconcilePaid()}
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-900 disabled:opacity-60"
              >
                {isReconciling ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Activating…
                  </>
                ) : (
                  "Activate premium"
                )}
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
