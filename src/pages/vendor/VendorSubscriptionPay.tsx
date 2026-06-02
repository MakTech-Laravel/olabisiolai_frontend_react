import { useCallback, useEffect, useState } from "react";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import PaystackPop from "@paystack/inline-js";
import { Loader2 } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { showError, showSuccess } from "@/lib/sweetAlert";

import { useAuth } from "@/auth/useAuth";
import { getAccessToken } from "@/auth/token";
import { hasAnyRole } from "@/auth/roles";
import type { BillingFormValues } from "@/components/sections/vendor/boost/boostPay/BillingInformationCard";
import { BillingInformationCard } from "@/components/sections/vendor/boost/boostPay/BillingInformationCard";
import { BoostPayHeader } from "@/components/sections/vendor/boost/boostPay/BoostPayHeader";
import { OrderSummaryCard } from "@/components/sections/vendor/boost/boostPay/OrderSummaryCard";
import { PaymentMethodsCard } from "@/components/sections/vendor/boost/boostPay/PaymentMethodsCard";
import { SavedCheckoutProfilesCard } from "@/components/sections/vendor/boost/boostPay/SavedCheckoutProfilesCard";
import { env } from "@/config/env";
import { formatNaira } from "@/lib/currency";
import {
  extractFlutterwaveCardMeta,
  extractFlutterwaveTransactionId,
  isFlutterwavePaymentSuccessful,
  type FlutterwaveCallbackResponse,
} from "@/features/payments/flutterwaveResponse";
import {
  readBoostCheckoutSelection,
  readPremiumBundledBoostSelection,
  clearBoostCheckoutSelection,
} from "@/features/boost/boostCheckoutSession";
import { primeVendorSubscriptionCaches } from "@/features/subscription/primeVendorSubscriptionCaches";
import {
  confirmSubscriptionPayment,
  fetchSubscriptionPackages,
  fetchSubscriptionStatus,
  initSubscriptionPayment,
  resumeSubscriptionPayment,
  type SubscriptionCheckoutInit,
  type SubscriptionPayment,
  type PaymentGateway,
} from "@/features/subscription/vendorSubscriptionApi";
import { getLaravelErrorMessage } from "@/lib/laravelApiError";
import { billingFromUser, billingFromVendorPaymentMethod } from "@/features/vendor/vendorBillingProfile";
import { createVendorPaymentMethod, fetchVendorPaymentMethods } from "@/features/vendor/vendorPaymentsApi";
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

  return {
    payment: parsePaymentRecord(data.payment) ?? subscription,
    payments: { subscription, boost },
    total_amount: Number.isFinite(total_amount) ? total_amount : subscription.amount,
    currency: String(data.currency ?? subscription.currency ?? "NGN"),
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
  boost?: { tierKey: string; durationDays: number },
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
    }),
  );
  if (!created) {
    throw new Error("Unable to prepare premium checkout.");
  }
  return created;
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
  const queryClient = useQueryClient();
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>("paystack");
  const [isPaying, setIsPaying] = useState(false);
  const [checkout, setCheckout] = useState<SubscriptionCheckoutInit | null>(() => readCheckoutFromSession());
  const [shouldOpenFlutterwave, setShouldOpenFlutterwave] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [billing, setBilling] = useState<BillingFormValues>(() => billingFromUser(null));
  const [saveProfileAfterPay, setSaveProfileAfterPay] = useState(true);
  const [profileInitDone, setProfileInitDone] = useState(false);

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
    queryKey: ["vendor", "subscription", "status"],
    queryFn: fetchSubscriptionStatus,
    enabled: canFetchPackages,
    retry: 1,
  });

  const [boostSelection, setBoostSelection] = useState(() => readPremiumBundledBoostSelection());

  useEffect(() => {
    const stored = readBoostCheckoutSelection();
    if (stored && !stored.bundledWithPremium) {
      clearBoostCheckoutSelection();
    }
    setBoostSelection(readPremiumBundledBoostSelection());
  }, []);
  const premiumPackage = packagesData?.packages[0];
  const premiumBase = premiumPackage?.amount ?? 25000;
  const boostAddon = boostSelection?.amount ?? 0;
  const subscriptionLine = checkout?.payments.subscription ?? checkout?.payment ?? null;
  const boostLinePayment = checkout?.payments.boost ?? null;
  const amountNgn =
    checkout?.total_amount ??
    (subscriptionLine?.amount ?? premiumBase) + (boostLinePayment?.amount ?? boostAddon);

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

  const flutterAmount = checkout?.total_amount ?? amountNgn;
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
      description: "Annual premium subscription",
      logo: "/favicon.ico",
    },
  });

  const persistCheckout = useCallback((init: SubscriptionCheckoutInit | null) => {
    const normalized = init ? normalizeCheckout(init) : null;
    setCheckout(normalized);
    writeCheckoutToSession(normalized);
  }, []);

  const openPaystack = useCallback(
    async (freshCheckout: SubscriptionCheckoutInit) => {
      if (!env.paystackPublicKey) {
        showError("Paystack public key is missing. Set VITE_PAYSTACK_PUBLIC_KEY.");
        return;
      }

      const paymentId = resolveSubscriptionPaymentId(freshCheckout);
      const amountKobo = Math.round((freshCheckout.total_amount ?? amountNgn) * 100);
      const currency = freshCheckout.currency ?? flutterCurrency;
      const reference = freshCheckout.payments.subscription.tx_ref ?? flutterTxRef;

      const paystack = new PaystackPop();
      paystack.newTransaction({
        key: env.paystackPublicKey,
        email: customerEmail,
        amount: amountKobo,
        currency,
        ref: reference,
        metadata: {
          custom_fields: [
            { display_name: "Customer name", variable_name: "customer_name", value: customerName },
            { display_name: "Phone", variable_name: "phone", value: customerPhone },
          ],
        },
        onClose: () => {
          setIsPaying(false);
        },
        callback: async (response: { reference?: string }) => {
          try {
            const paystackRef = String(response?.reference ?? "").trim();
            if (!paystackRef) {
              showError("Payment completed but Paystack reference was missing.");
              return;
            }

            const result = await confirmSubscriptionPayment(paymentId, paystackRef, "paystack");

            persistCheckout(null);
            clearBoostCheckoutSelection();

            if (result.subscription.is_premium_active) {
              localStorage.setItem("vendorPlan", "premium");
            } else {
              localStorage.removeItem("vendorPlan");
            }
            localStorage.setItem("vendorBusinessCreated", "true");
            primeVendorSubscriptionCaches(queryClient, result.subscription);

            navigate("/vendor/dashboard", { replace: true });
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
      });
    },
    [
      amountNgn,
      customerEmail,
      customerName,
      customerPhone,
      env.paystackPublicKey,
      flutterCurrency,
      flutterTxRef,
      navigate,
      persistCheckout,
      queryClient,
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

  const trySaveProfileFromResponse = useCallback(
    async (response: FlutterwaveCallbackResponse) => {
      if (!saveProfileAfterPay) return;
      const card = extractFlutterwaveCardMeta(response);
      try {
        await createVendorPaymentMethod({
          label: card.card_brand && card.last_four ? `${card.card_brand} •••• ${card.last_four}` : "Subscription checkout",
          cardholder_name: billing.cardholder_name.trim() || customerName,
          email: billing.email.trim() || customerEmail,
          phone: billing.phone.trim() || customerPhone,
          last_four: card.last_four,
          card_brand: card.card_brand,
          exp_month: card.exp_month,
          exp_year: card.exp_year,
          billing_line1: billing.billing_line1.trim() || null,
          billing_city: billing.billing_city.trim() || null,
          billing_state: billing.billing_state.trim() || null,
          billing_country: billing.billing_country.trim() || null,
          is_default: true,
        });
        void queryClient.invalidateQueries({ queryKey: ["vendor", "payment-methods"] });
      } catch {
        // non-blocking
      }
    },
    [
      saveProfileAfterPay,
      billing.billing_city,
      billing.billing_country,
      billing.billing_line1,
      billing.billing_state,
      billing.cardholder_name,
      billing.email,
      billing.phone,
      customerEmail,
      customerName,
      customerPhone,
      queryClient,
    ],
  );

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
              boostSelection
                ? { tierKey: boostSelection.tierKey, durationDays: boostSelection.durationDays }
                : undefined,
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

          navigate("/vendor/dashboard", { replace: true });
          showSuccess(result.message || "Premium subscription activated successfully.");

          void trySaveProfileFromResponse(response);
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
    queryClient,
    trySaveProfileFromResponse,
  ]);

  const onRemoveBoostAddon = () => {
    clearBoostCheckoutSelection();
    setBoostSelection(null);
    persistCheckout(null);
  };

  const onConfirmPay = async () => {
    if (selectedGateway === "flutterwave" && !env.flutterwavePublicKey) {
      showError("Flutterwave public key is missing. Set VITE_FLUTTERWAVE_PUBLIC_KEY.");
      return;
    }
    if (selectedGateway === "paystack" && !env.paystackPublicKey) {
      showError("Paystack public key is missing. Set VITE_PAYSTACK_PUBLIC_KEY.");
      return;
    }

    if (!billing.email.trim() || !billing.phone.trim() || !billing.cardholder_name.trim()) {
      showError("Please fill in billing name, email, and phone before paying.");
      return;
    }

    try {
      setIsPaying(true);

      const resumed = normalizeCheckout(await resumeSubscriptionPayment().catch(() => null));
      const fresh =
        resumed ??
        normalizeCheckout(
          await initSubscriptionPayment({
            gateway: selectedGateway,
            boost: boostSelection
              ? { tierKey: boostSelection.tierKey, durationDays: boostSelection.durationDays }
              : undefined,
          }),
        );
      if (!fresh) {
        throw new Error("Unable to prepare premium checkout.");
      }
      persistCheckout(fresh);
      if (selectedGateway === "flutterwave") {
        setShouldOpenFlutterwave(true);
      } else {
        void openPaystack(fresh);
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

  const billingHint =
    selectedProfileId !== null
      ? "Using a saved profile — you can still edit fields before opening the payment window. Card number and CVV are entered only inside Flutterwave."
      : null;

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
    <div className="p-4 md:p-6">
      <div className="space-y-4">
        <BoostPayHeader variant="subscription" />

        {packagesError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Could not load premium package details. You can still pay {formatNaira(amountNgn, { freeLabel: false })} below.
          </p>
        ) : null}

        <div className="mt-10 grid gap-4 xl:grid-cols-[1fr_390px]">
          <div className="space-y-4">
            <PaymentMethodsCard selectedGateway={selectedGateway} onGatewayChange={setSelectedGateway} />
            <SavedCheckoutProfilesCard
              items={methods}
              selectedId={selectedProfileId}
              onSelect={onSelectProfile}
            />
            <BillingInformationCard value={billing} onChange={setBilling} editable hint={billingHint} />
          </div>

          <OrderSummaryCard
            onConfirmPay={() => void onConfirmPay()}
            isPaying={isPaying || packagesLoading}
            planTitle={premiumPackage?.title ?? "Premium"}
            totalAmount={amountNgn}
            boostLine={
              boostLinePayment && boostLinePayment.amount > 0
                ? {
                  label:
                    boostSelection
                      ? `${boostSelection.tierLabel} · ${boostSelection.durationDays} days`
                      : "Boost campaign",
                  amount: boostLinePayment.amount,
                }
                : boostSelection
                  ? {
                    label: `${boostSelection.tierLabel} · ${boostSelection.durationDays} days`,
                    amount: boostSelection.amount,
                  }
                  : null
            }
            isVerification={false}
            beforePayButton={
              <div className="space-y-2">
                {boostSelection ? (
                  <button
                    type="button"
                    className="text-xs font-semibold text-brand-red underline"
                    onClick={onRemoveBoostAddon}
                  >
                    Remove boost add-on (pay premium only)
                  </button>
                ) : null}
                <label className="flex cursor-pointer items-start gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 rounded border"
                    checked={saveProfileAfterPay}
                    onChange={(e) => setSaveProfileAfterPay(e.target.checked)}
                  />
                  <span>
                    After a successful card payment, save masked card details and billing as a default checkout
                    profile (last 4 digits only; never your full card number).
                  </span>
                </label>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
