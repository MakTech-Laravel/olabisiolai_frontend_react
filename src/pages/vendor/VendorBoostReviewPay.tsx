import { useCallback, useEffect, useState } from "react";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import PaystackPop from "@paystack/inline-js";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { alert, showError, showInfo, showSuccess } from "@/lib/sweetAlert";
import { formatNaira } from "@/lib/currency";

import { useAuth } from "@/auth/useAuth";
import { getAccessToken } from "@/auth/token";
import type { BillingFormValues } from "@/components/sections/vendor/boost/boostPay/BillingInformationCard";
import { BoostPayHeader } from "@/components/sections/vendor/boost/boostPay/BoostPayHeader";
import { OrderSummaryCard } from "@/components/sections/vendor/boost/boostPay/OrderSummaryCard";
import { PaymentMethodsCard, type CheckoutGateway } from "@/components/sections/vendor/boost/boostPay/PaymentMethodsCard";
import { SavedCheckoutProfilesCard } from "@/components/sections/vendor/boost/boostPay/SavedCheckoutProfilesCard";
import { plans, type PlanId } from "@/components/sections/vendor/verification/verificationData";
import { env } from "@/config/env";
import {
  extractFlutterwaveCardMeta,
  extractFlutterwaveTransactionId,
  isFlutterwavePaymentSuccessful,
  type FlutterwaveCallbackResponse,
} from "@/features/payments/flutterwaveResponse";
import {
  clearVerificationPaymentSession,
  confirmVerificationPayment,
  fetchVerificationPackages,
  fetchVerificationStatus,
  initVerificationPayment,
  primeVerificationDocumentSession,
  type VerificationPayment,
} from "@/features/verification/vendorVerificationApi";
import { billingFromUser, billingFromVendorPaymentMethod } from "@/features/vendor/vendorBillingProfile";
import { createVendorPaymentMethod, fetchVendorPaymentMethods } from "@/features/vendor/vendorPaymentsApi";
import type { VendorPaymentMethod } from "@/features/vendor/vendorPaymentsApi";
import {
  clearBoostCheckoutSelection,
  readBoostCheckoutSelection,
  saveBoostCheckoutSelection,
} from "@/features/boost/boostCheckoutSession";
import {
  confirmVendorBoostPayment,
  initVendorBoostPayment,
  resumeVendorBoostPayment,
  type BoostPaymentSession,
} from "@/features/boost/vendorBoostApi";
import { formatBoostBudget } from "@/features/boost/dynamicBoostConfig";
import { getLaravelErrorMessage } from "@/lib/laravelApiError";
import { profileNeedsEmailVerification } from "@/api/userEmailVerification";
import { fetchVendorSettings } from "@/api/vendorSettings";
import { PurchaseEmailVerificationBlock } from "@/components/settings/PurchaseEmailVerificationBlock";

const PLAN_STORAGE_KEY = "verificationPlanId";

type CheckoutPayment = VerificationPayment | BoostPaymentSession;

function redirectToDocumentUpload(
  navigate: ReturnType<typeof useNavigate>,
  status: Awaited<ReturnType<typeof fetchVerificationStatus>> | null,
) {
  if (status) {
    primeVerificationDocumentSession(status);
  }
  navigate("/vendor/document-upload", { replace: true });
}

export default function VendorBoostReviewPayPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedGateway, setSelectedGateway] = useState<CheckoutGateway>("paystack");
  const [isPaying, setIsPaying] = useState(false);
  const [checkoutPayment, setCheckoutPayment] = useState<CheckoutPayment | null>(null);
  const [shouldOpenFlutterwave, setShouldOpenFlutterwave] = useState(false);
  const [billing, setBilling] = useState<BillingFormValues>(() => billingFromUser(null));
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [profileInitDone, setProfileInitDone] = useState(false);
  const [saveProfileAfterPay, setSaveProfileAfterPay] = useState(true);
  const { user } = useAuth();

  const isVerification = sessionStorage.getItem("paymentSource") === "verification";
  const boostSelection = readBoostCheckoutSelection();
  const isBoostCheckout = !isVerification && boostSelection !== null;
  const packageId = (sessionStorage.getItem(PLAN_STORAGE_KEY) as PlanId | null) ?? "individual";
  const selectedPlan = plans.find((p) => p.id === packageId) ?? plans[0];

  const { data: packagesData } = useQuery({
    queryKey: ["vendor", "verification", "packages"],
    queryFn: fetchVerificationPackages,
    enabled: isVerification,
    staleTime: 60_000,
  });

  const { data: verificationStatus } = useQuery({
    queryKey: ["vendor", "verification", "status", "review-pay"],
    queryFn: fetchVerificationStatus,
    enabled: isVerification,
    staleTime: 0,
  });

  const { data: methodsData } = useQuery({
    queryKey: ["vendor", "payment-methods"],
    queryFn: fetchVendorPaymentMethods,
    enabled: Boolean(getAccessToken()),
    staleTime: 30_000,
  });

  const { data: vendorSettings } = useQuery({
    queryKey: ["vendor", "settings"],
    queryFn: fetchVendorSettings,
    enabled: Boolean(getAccessToken()),
    staleTime: 30_000,
  });

  const emailVerificationProfile = vendorSettings?.profile ?? user;
  const purchaseBlockedByEmail = profileNeedsEmailVerification(emailVerificationProfile);

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

  const apiPackage = packagesData?.packages.find((p) => p.id === packageId);
  const amountNgn = isBoostCheckout
    ? (checkoutPayment?.amount ?? boostSelection?.amount ?? 0)
    : (checkoutPayment?.amount ??
      apiPackage?.amount ??
      selectedPlan.amount ??
      5000);

  const boostPlanTitle = boostSelection
    ? `${boostSelection.tierLabel} · ${boostSelection.durationDays} days`
    : "Boost campaign";

  useEffect(() => {
    if (!isVerification || !verificationStatus?.awaiting_document_submission) {
      return;
    }
    showInfo("Payment already completed. Continue with document upload.");
    redirectToDocumentUpload(navigate, verificationStatus);
  }, [isVerification, navigate, verificationStatus]);

  useEffect(() => {
    if (isVerification || isBoostCheckout) {
      return;
    }
    navigate("/vendor/verification", { replace: true });
  }, [isBoostCheckout, isVerification, navigate]);

  const isResumingBoostPayment = Boolean(isBoostCheckout && boostSelection?.requestId);

  useEffect(() => {
    if (!isBoostCheckout || !boostSelection?.requestId) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const { payment } = await resumeVendorBoostPayment(boostSelection.requestId!);
        if (!cancelled) {
          setCheckoutPayment(payment);
        }
      } catch (error) {
        if (!cancelled) {
          showError(getLaravelErrorMessage(error, "Unable to resume boost payment."));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isBoostCheckout, boostSelection?.requestId]);

  const customerEmail = billing.email.trim() || user?.email || "guest@gidira.app";
  const customerPhone = billing.phone.trim() || "08000000000";
  const customerName = billing.cardholder_name.trim() || "Gidira Vendor";

  const flutterwaveTxRef =
    checkoutPayment?.tx_ref ??
    (isBoostCheckout ? `boost_pending_${boostSelection?.tierKey ?? "plan"}` : `verification_pending_${packageId}`);

  const handleFlutterPayment = useFlutterwave({
    public_key: env.flutterwavePublicKey,
    tx_ref: flutterwaveTxRef,
    amount: amountNgn,
    currency: checkoutPayment?.currency ?? packagesData?.currency ?? "NGN",
    payment_options: "card",
    customer: {
      email: customerEmail,
      phone_number: customerPhone,
      name: customerName,
    },
    customizations: {
      title: isVerification ? "Gidira Verification Payment" : "Gidira Boost Payment",
      description: isVerification
        ? "Verification package"
        : boostSelection?.renewType === "extend"
          ? "Extend boost campaign"
          : "Boost plan purchase",
      logo: "/favicon.svg",
    },
  });

  const completeBoostCheckout = useCallback(
    async (paymentId: number, gatewayTransactionId: string) => {
      const result = await confirmVendorBoostPayment(
        paymentId,
        gatewayTransactionId,
        selectedGateway as "flutterwave" | "paystack",
      );
      clearBoostCheckoutSelection();
      void queryClient.invalidateQueries({ queryKey: ["vendor", "boost", "catalog"] });
      void queryClient.invalidateQueries({ queryKey: ["vendor", "business"] });
      void queryClient.invalidateQueries({ queryKey: ["vendor", "business", "profile"] });
      navigate("/vendor/boost", { replace: true });
      showSuccess(
        result.message ||
        "Payment received. An admin will assign your boost — your campaign will extend once approved.",
      );
    },
    [navigate, queryClient],
  );

  const completeVerificationCheckout = useCallback(
    async (paymentId: number, gatewayTransactionId: string) => {
      const result = await confirmVerificationPayment(
        paymentId,
        gatewayTransactionId,
        selectedGateway as "flutterwave" | "paystack",
      );

      if (result.consumable_payment_id) {
        sessionStorage.setItem("verificationPaymentId", String(result.consumable_payment_id));
      }

      if (result.awaiting_document_submission) {
        const status = await fetchVerificationStatus();
        redirectToDocumentUpload(navigate, status);
        return;
      }

      navigate("/vendor/document-upload", { replace: true });
    },
    [navigate],
  );

  const trySaveProfileFromResponse = useCallback(
    async (response: FlutterwaveCallbackResponse) => {
      if (!saveProfileAfterPay) return;
      const card = extractFlutterwaveCardMeta(response);
      try {
        await createVendorPaymentMethod({
          label:
            card.card_brand && card.last_four
              ? `${card.card_brand} •••• ${card.last_four}`
              : "Verification checkout",
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
      billing,
      customerEmail,
      customerName,
      customerPhone,
      queryClient,
    ],
  );

  const recoverAfterConfirmFailure = useCallback(async (): Promise<boolean> => {
    try {
      const status = await fetchVerificationStatus();
      if (status.awaiting_document_submission) {
        redirectToDocumentUpload(navigate, status);
        return true;
      }
    } catch {
      // ignore recovery probe errors
    }
    return false;
  }, [navigate]);

  const openPaystack = useCallback(
    async (payment: CheckoutPayment) => {
      if (!env.paystackPublicKey) {
        showError("Paystack public key is missing. Set VITE_PAYSTACK_PUBLIC_KEY.");
        return;
      }

      const amountKobo = Math.round(amountNgn * 100);
      const currency = payment.currency ?? packagesData?.currency ?? "NGN";
      const reference = payment.tx_ref;

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
        onClose: () => setIsPaying(false),
        callback: async (response: { reference?: string }) => {
          try {
            const paystackRef = String(response?.reference ?? "").trim();
            if (!paystackRef) {
              showError("Payment completed but Paystack reference was missing.");
              return;
            }

            if (isBoostCheckout) {
              await completeBoostCheckout(payment.id, paystackRef);
            } else {
              await completeVerificationCheckout(payment.id, paystackRef);
              showSuccess("Payment confirmed. Upload your documents next.");
            }

            clearBoostCheckoutSelection();
            void queryClient.invalidateQueries({ queryKey: ["vendor", "payments"] });
          } catch (error) {
            const recovered = await recoverAfterConfirmFailure();
            if (recovered) {
              showSuccess("Payment confirmed. Upload your documents next.");
              return;
            }
            showError(
              getLaravelErrorMessage(
                error,
                "Payment succeeded but confirmation failed. Contact support.",
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
      completeBoostCheckout,
      completeVerificationCheckout,
      customerEmail,
      customerName,
      customerPhone,
      env.paystackPublicKey,
      isBoostCheckout,
      packagesData?.currency,
      queryClient,
      recoverAfterConfirmFailure,
    ],
  );

  useEffect(() => {
    if (!shouldOpenFlutterwave || !checkoutPayment) {
      return;
    }

    setShouldOpenFlutterwave(false);
    const resolvedPaymentId = checkoutPayment.id;

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

          if (isBoostCheckout) {
            await completeBoostCheckout(resolvedPaymentId, txId);
          } else {
            await completeVerificationCheckout(resolvedPaymentId, txId);
            showSuccess("Payment confirmed. Upload your documents next.");
          }
          await trySaveProfileFromResponse(response);
          void queryClient.invalidateQueries({ queryKey: ["vendor", "payments"] });
          closePaymentModal();
        } catch (error) {
          const recovered = await recoverAfterConfirmFailure();
          if (recovered) {
            closePaymentModal();
            showSuccess("Payment confirmed. Upload your documents next.");
            return;
          }
          showError(
            getLaravelErrorMessage(
              error,
              "Payment succeeded but confirmation failed. Contact support.",
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
    checkoutPayment,
    handleFlutterPayment,
    recoverAfterConfirmFailure,
    completeVerificationCheckout,
    completeBoostCheckout,
    isBoostCheckout,
    trySaveProfileFromResponse,
    queryClient,
  ]);

  const onConfirmPay = async () => {
    if (purchaseBlockedByEmail) {
      showError("Verify your email in Settings before making a purchase.");
      return;
    }
    if (selectedGateway === "flutterwave" && !env.flutterwavePublicKey) {
      showError("Flutterwave public key is missing. Set VITE_FLUTTERWAVE_PUBLIC_KEY.");
      return;
    }
    if (selectedGateway === "paystack" && !env.paystackPublicKey) {
      showError("Paystack public key is missing. Set VITE_PAYSTACK_PUBLIC_KEY.");
      return;
    }

    if (!isVerification && !isBoostCheckout) {
      showError("No boost checkout found. Select a plan from the boost page first.");
      navigate("/vendor/boost", { replace: true });
      return;
    }

    if (!getAccessToken()) {
      showError("Your session expired. Please sign in again.");
      navigate("/login", { replace: true, state: { from: "/vendor/review-pay" } });
      return;
    }

    if (verificationStatus?.awaiting_document_submission) {
      redirectToDocumentUpload(navigate, verificationStatus);
      return;
    }

    if (selectedGateway === "wallet") {
      const confirmed = await alert.confirm({
        title: "Pay with Gidira Wallet?",
        html: `<p>${formatNaira(amountNgn, { freeLabel: false })} will be deducted from your wallet balance immediately.</p>`,
        icon: "question",
        confirmText: "Yes, pay",
        cancelText: "Cancel",
      });

      if (!confirmed) {
        return;
      }
    }

    try {
      setIsPaying(true);

      if (selectedGateway === "wallet") {
        if (isBoostCheckout && boostSelection) {
          const { payment, requestId, message, paidFromWallet } = await initVendorBoostPayment({
            durationDays: boostSelection.durationDays,
            budgetAmount: boostSelection.budgetAmount,
            locationId: boostSelection.locationId,
            renewType: boostSelection.renewType,
            sourceCampaignId: boostSelection.sourceCampaignId,
            useWallet: true,
          });

          if (!paidFromWallet) {
            setCheckoutPayment(payment);
            if (requestId) {
              saveBoostCheckoutSelection({
                ...boostSelection,
                paymentId: payment.id,
                requestId,
              }, { standalonePayment: true });
            }
            return;
          }

          clearBoostCheckoutSelection();
          void queryClient.invalidateQueries({ queryKey: ["vendor", "boost", "catalog"] });
          void queryClient.invalidateQueries({ queryKey: ["vendor", "business"] });
          void queryClient.invalidateQueries({ queryKey: ["vendor", "business", "profile"] });
          void queryClient.invalidateQueries({ queryKey: ["user", "wallet"] });
          navigate("/vendor/boost", { replace: true });
          showSuccess(message || "Payment received. An admin will assign your boost shortly.");
          return;
        }

        clearVerificationPaymentSession();

        const result = await initVerificationPayment(packageId, undefined, true);

        if (!result.paid_from_wallet) {
          setCheckoutPayment(result.payment);
          return;
        }

        if (result.consumable_payment_id) {
          sessionStorage.setItem("verificationPaymentId", String(result.consumable_payment_id));
        }
        void queryClient.invalidateQueries({ queryKey: ["vendor", "payments"] });
        void queryClient.invalidateQueries({ queryKey: ["user", "wallet"] });

        if (result.awaiting_document_submission) {
          const status = await fetchVerificationStatus();
          redirectToDocumentUpload(navigate, status);
        } else {
          navigate("/vendor/document-upload", { replace: true });
        }
        showSuccess("Payment confirmed. Upload your documents next.");
        return;
      }

      if (isBoostCheckout && boostSelection) {
        if (
          checkoutPayment &&
          checkoutPayment.status === "pending" &&
          !checkoutPayment.is_consumed
        ) {
          if (selectedGateway === "flutterwave") {
            setShouldOpenFlutterwave(true);
          } else {
            void openPaystack(checkoutPayment);
          }
          return;
        }

        if (boostSelection.requestId) {
          const { payment } = await resumeVendorBoostPayment(boostSelection.requestId);
          setCheckoutPayment(payment);
          if (selectedGateway === "flutterwave") {
            setShouldOpenFlutterwave(true);
          } else {
            void openPaystack(payment);
          }
          return;
        }

        const { payment, requestId } = await initVendorBoostPayment({
          durationDays: boostSelection.durationDays,
          budgetAmount: boostSelection.budgetAmount,
          locationId: boostSelection.locationId,
          renewType: boostSelection.renewType,
          sourceCampaignId: boostSelection.sourceCampaignId,
          gateway: selectedGateway,
        });
        setCheckoutPayment(payment);
        if (requestId) {
          saveBoostCheckoutSelection({
            ...boostSelection,
            paymentId: payment.id,
            requestId,
          }, { standalonePayment: true });
        }
        if (selectedGateway === "flutterwave") {
          setShouldOpenFlutterwave(true);
        } else {
          void openPaystack(payment);
        }
        return;
      }

      clearVerificationPaymentSession();

      const result = await initVerificationPayment(packageId, selectedGateway);
      setCheckoutPayment(result.payment);
      if (selectedGateway === "flutterwave") {
        setShouldOpenFlutterwave(true);
      } else {
        void openPaystack(result.payment);
      }
    } catch (error) {
      setIsPaying(false);
      showError(getLaravelErrorMessage(error, "Unable to start payment."));
    } finally {
      if (selectedGateway === "wallet") {
        setIsPaying(false);
      }
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

  const methods = methodsData?.items ?? [];

  return (
    <div className="p-4 md:p-6">
      <div className="space-y-4">
        <BoostPayHeader />

        <PurchaseEmailVerificationBlock profile={emailVerificationProfile} />

        <div className="mt-10 grid gap-4 xl:grid-cols-[1fr_390px]">
          <div className="space-y-4">
            <PaymentMethodsCard
              selectedGateway={selectedGateway}
              onGatewayChange={setSelectedGateway}
              totalAmount={amountNgn}
            />
            <SavedCheckoutProfilesCard
              items={methods}
              selectedId={selectedProfileId}
              onSelect={onSelectProfile}
            />
          </div>

          <OrderSummaryCard
            onConfirmPay={() => void onConfirmPay()}
            isPaying={isPaying || purchaseBlockedByEmail}
            confirmLabel={isResumingBoostPayment ? "Continue Payment" : undefined}
            planTitle={
              isBoostCheckout
                ? boostPlanTitle
                : isVerification
                  ? (apiPackage?.title ?? selectedPlan.title)
                  : "Visibility Pro Plus"
            }
            totalAmount={amountNgn}
            isVerification={isVerification}
            boostLine={null}
            beforePayButton={
              <div className="space-y-2">
                {isBoostCheckout && boostSelection ? (
                  <div className="rounded-lg border border-border-light bg-muted/30 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Daily budget</span>
                      <span className="font-semibold text-foreground">
                        {formatBoostBudget(boostSelection.budgetAmount)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-muted-foreground">Total cost</span>
                      <span className="font-bold text-brand">{formatBoostBudget(amountNgn)}</span>
                    </div>
                  </div>
                ) : null}
                <label className="flex cursor-pointer items-start gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 rounded border"
                  checked={saveProfileAfterPay}
                  onChange={(e) => setSaveProfileAfterPay(e.target.checked)}
                />
                <span>
                  After a successful card payment, save masked card details and billing as a default checkout profile.
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
