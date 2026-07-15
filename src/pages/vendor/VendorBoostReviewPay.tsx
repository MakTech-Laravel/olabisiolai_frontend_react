import { useCallback, useEffect, useState } from "react";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { showError, showInfo, showSuccess } from "@/lib/sweetAlert";
import { fetchUserWallet } from "@/api/wallet";

import { useAuth } from "@/auth/useAuth";
import { getAccessToken } from "@/auth/token";
import type { BillingFormValues } from "@/components/sections/vendor/boost/boostPay/BillingInformationCard";
import { BoostPayHeader } from "@/components/sections/vendor/boost/boostPay/BoostPayHeader";
import { OrderSummaryCard } from "@/components/sections/vendor/boost/boostPay/OrderSummaryCard";
import { PaymentMethodsCard, type CheckoutGateway } from "@/components/sections/vendor/boost/boostPay/PaymentMethodsCard";
import { WalletApplySection } from "@/components/sections/vendor/boost/boostPay/WalletApplySection";
import { SavedCheckoutProfilesCard } from "@/components/sections/vendor/boost/boostPay/SavedCheckoutProfilesCard";
import { plans, type PlanId } from "@/components/sections/vendor/verification/verificationData";
import { env } from "@/config/env";
import {
  extractFlutterwaveTransactionId,
  isFlutterwavePaymentSuccessful,
  type FlutterwaveCallbackResponse,
} from "@/features/payments/flutterwaveResponse";
import { openPaystackCheckout } from "@/features/payments/openPaystackCheckout";
import {
  confirmVerificationPayment,
  fetchVerificationPackages,
  fetchVerificationStatus,
  initVerificationPayment,
  primeVerificationDocumentSession,
  type VerificationPayment,
} from "@/features/verification/vendorVerificationApi";
import { billingFromUser, billingFromVendorPaymentMethod } from "@/features/vendor/vendorBillingProfile";
import { fetchVendorPaymentMethods } from "@/features/vendor/vendorPaymentsApi";
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
import { PaystackEmailQuickSet } from "@/components/settings/PaystackEmailQuickSet";

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
  const [applyWallet, setApplyWallet] = useState(false);
  const [walletAppliedAmount, setWalletAppliedAmount] = useState(0);
  const [gatewayAmount, setGatewayAmount] = useState<number | null>(null);
  const [paystackAccessCode, setPaystackAccessCode] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [checkoutPayment, setCheckoutPayment] = useState<CheckoutPayment | null>(null);
  const [shouldOpenFlutterwave, setShouldOpenFlutterwave] = useState(false);
  const [billing, setBilling] = useState<BillingFormValues>(() => billingFromUser(null));
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [profileInitDone, setProfileInitDone] = useState(false);
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

  const { data: walletData } = useQuery({
    queryKey: ["user", "wallet"],
    queryFn: fetchUserWallet,
    enabled: Boolean(getAccessToken()),
    staleTime: 15_000,
  });

  const emailVerificationProfile = vendorSettings?.profile ?? user;
  const purchaseBlockedByEmail = profileNeedsEmailVerification(emailVerificationProfile);
  const paystackNeedsEmailVerification =
    selectedGateway === "paystack" && !emailVerificationProfile?.email;

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
    if (!isVerification || !verificationStatus?.pending_payment) {
      return;
    }

    const pending = verificationStatus.pending_payment;
    if (pending.status !== "pending" || pending.is_consumed) {
      return;
    }

    setCheckoutPayment(pending);
    const walletApplied = Number(pending.metadata?.wallet_applied ?? 0);
    const gatewayFromMeta = pending.metadata?.gateway_amount;
    setWalletAppliedAmount(walletApplied);
    setGatewayAmount(
      gatewayFromMeta != null
        ? Number(gatewayFromMeta)
        : Math.max(0, pending.amount - walletApplied),
    );
    if (walletApplied > 0) {
      setApplyWallet(true);
    }
  }, [isVerification, verificationStatus]);

  useEffect(() => {
    if (!profileInitDone) return;
    if (selectedProfileId !== null) return;
    setBilling(billingFromUser(user));
  }, [user, profileInitDone, selectedProfileId]);

  const apiPackage = packagesData?.packages.find((p) => p.id === packageId);
  const subtotalNgn = isBoostCheckout
    ? (checkoutPayment?.amount ?? boostSelection?.amount ?? 0)
    : (checkoutPayment?.amount ??
      apiPackage?.amount ??
      selectedPlan.amount ??
      5000);
  const estimatedWalletApplied = applyWallet
    ? Math.min(walletData?.balance ?? 0, subtotalNgn)
    : 0;
  const displayWalletApplied = applyWallet ? (walletAppliedAmount || estimatedWalletApplied) : 0;
  const amountNgn = applyWallet
    ? (gatewayAmount ?? Math.max(0, subtotalNgn - estimatedWalletApplied))
    : subtotalNgn;

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
    async (payment: CheckoutPayment, accessCode?: string | null) => {
      const payableAmount = gatewayAmount ?? payment.amount;
      const resolvedAccessCode = accessCode ?? paystackAccessCode;

      await openPaystackCheckout({
        email: customerEmail,
        amountNgn: payableAmount,
        currency: payment.currency ?? packagesData?.currency ?? "NGN",
        reference: payment.tx_ref,
        accessCode: resolvedAccessCode,
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
      completeBoostCheckout,
      completeVerificationCheckout,
      customerEmail,
      customerName,
      customerPhone,
      gatewayAmount,
      isBoostCheckout,
      packagesData?.currency,
      paystackAccessCode,
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
    queryClient,
  ]);

  const onConfirmPay = async () => {
    if (purchaseBlockedByEmail) {
      showError("Verify your email in Settings before making a purchase.");
      return;
    }

    if (paystackNeedsEmailVerification) {
      showError("Add and verify your email above to pay with Paystack.");
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

    try {
      setIsPaying(true);

      if (isBoostCheckout && boostSelection) {
        if (
          checkoutPayment &&
          checkoutPayment.status === "pending" &&
          !checkoutPayment.is_consumed &&
          !applyWallet
        ) {
          if (selectedGateway === "flutterwave") {
            setShouldOpenFlutterwave(true);
            return;
          }

          if (boostSelection.requestId) {
            const resumed = await resumeVendorBoostPayment(
              boostSelection.requestId,
              selectedGateway as "flutterwave" | "paystack",
            );
            setCheckoutPayment(resumed.payment);
            setGatewayAmount(resumed.gatewayAmount ?? null);
            setWalletAppliedAmount(resumed.walletApplied ?? 0);
            setPaystackAccessCode(resumed.paystackAccessCode ?? null);
            void openPaystack(resumed.payment, resumed.paystackAccessCode);
            return;
          }

          // Fall through to init so Paystack always gets a fresh access code.
        }

        if (!applyWallet && boostSelection.requestId) {
          if (selectedGateway === "flutterwave") {
            const { payment } = await resumeVendorBoostPayment(boostSelection.requestId);
            setCheckoutPayment(payment);
            setShouldOpenFlutterwave(true);
            return;
          }

          const resumed = await resumeVendorBoostPayment(
            boostSelection.requestId,
            selectedGateway as "flutterwave" | "paystack",
          );
          setCheckoutPayment(resumed.payment);
          setGatewayAmount(resumed.gatewayAmount ?? null);
          setWalletAppliedAmount(resumed.walletApplied ?? 0);
          setPaystackAccessCode(resumed.paystackAccessCode ?? null);
          void openPaystack(resumed.payment, resumed.paystackAccessCode);
          return;
        }

        const { payment, requestId, message, paidFromWallet, gatewayAmount: nextGatewayAmount, walletApplied, paystackAccessCode: nextPaystackAccessCode } =
          await initVendorBoostPayment({
            durationDays: boostSelection.durationDays,
            budgetAmount: boostSelection.budgetAmount,
            locationId: boostSelection.locationId,
            renewType: boostSelection.renewType,
            sourceCampaignId: boostSelection.sourceCampaignId,
            gateway: selectedGateway,
            applyWallet,
          });

        setWalletAppliedAmount(walletApplied ?? 0);
        setGatewayAmount(nextGatewayAmount ?? null);
        setPaystackAccessCode(nextPaystackAccessCode ?? null);

        if (paidFromWallet) {
          clearBoostCheckoutSelection();
          void queryClient.invalidateQueries({ queryKey: ["vendor", "boost", "catalog"] });
          void queryClient.invalidateQueries({ queryKey: ["vendor", "business"] });
          void queryClient.invalidateQueries({ queryKey: ["vendor", "business", "profile"] });
          void queryClient.invalidateQueries({ queryKey: ["user", "wallet"] });
          navigate("/vendor/boost", { replace: true });
          showSuccess(message || "Payment received. An admin will assign your boost shortly.");
          setIsPaying(false);
          return;
        }

        setCheckoutPayment(payment);
        if (requestId) {
          saveBoostCheckoutSelection({
            ...boostSelection,
            paymentId: payment.id,
            requestId,
          }, { standalonePayment: true });
        }

        const payableAmount = nextGatewayAmount ?? payment.amount;
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
          void openPaystack(payment, nextPaystackAccessCode);
        }
        return;
      }

      if (
        isVerification &&
        checkoutPayment &&
        checkoutPayment.status === "pending" &&
        !checkoutPayment.is_consumed
      ) {
        const payableAmount = gatewayAmount ?? checkoutPayment.amount;
        if (payableAmount <= 0) {
          const walletResult = await initVerificationPayment(packageId, selectedGateway, false, applyWallet);
          setWalletAppliedAmount(walletResult.wallet_applied ?? 0);
          setGatewayAmount(walletResult.gateway_amount ?? null);
          setPaystackAccessCode(walletResult.paystack_access_code ?? null);

          if (walletResult.paid_from_wallet) {
            if (walletResult.consumable_payment_id) {
              sessionStorage.setItem("verificationPaymentId", String(walletResult.consumable_payment_id));
            }
            void queryClient.invalidateQueries({ queryKey: ["vendor", "payments"] });
            void queryClient.invalidateQueries({ queryKey: ["user", "wallet"] });

            if (walletResult.awaiting_document_submission) {
              const status = await fetchVerificationStatus();
              redirectToDocumentUpload(navigate, status);
            } else {
              navigate("/vendor/document-upload", { replace: true });
            }
            showSuccess("Payment confirmed. Upload your documents next.");
            setIsPaying(false);
            return;
          }
        } else if (selectedGateway === "flutterwave") {
          setShouldOpenFlutterwave(true);
          return;
        } else {
          // Always re-init Paystack so cancelled attempts get a fresh access code.
          const refreshed = await initVerificationPayment(packageId, selectedGateway, false, applyWallet);
          setWalletAppliedAmount(refreshed.wallet_applied ?? 0);
          setGatewayAmount(refreshed.gateway_amount ?? null);
          setPaystackAccessCode(refreshed.paystack_access_code ?? null);
          setCheckoutPayment(refreshed.payment);
          void openPaystack(refreshed.payment, refreshed.paystack_access_code);
          return;
        }
      }

      const result = await initVerificationPayment(packageId, selectedGateway, false, applyWallet);
      setWalletAppliedAmount(result.wallet_applied ?? 0);
      setGatewayAmount(result.gateway_amount ?? null);
      setPaystackAccessCode(result.paystack_access_code ?? null);

      if (result.paid_from_wallet) {
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
        setIsPaying(false);
        return;
      }

      setCheckoutPayment(result.payment);

      const payableAmount = result.gateway_amount ?? result.payment.amount;
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
        void openPaystack(result.payment, result.paystack_access_code);
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

  const methods = methodsData?.items ?? [];

  return (
    <div className="container mx-auto p-2 md:p-4">
      <div className="space-y-4">
        <BoostPayHeader />

        <PurchaseEmailVerificationBlock profile={emailVerificationProfile} />

        <div className="mt-10 grid gap-4 xl:grid-cols-[1fr_390px]">
          <div className="space-y-4">
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
            isPaying={isPaying || purchaseBlockedByEmail || paystackNeedsEmailVerification}
            confirmLabel={isResumingBoostPayment ? "Continue Payment" : undefined}
            planTitle={
              isBoostCheckout
                ? boostPlanTitle
                : isVerification
                  ? (apiPackage?.title ?? selectedPlan.title)
                  : "Visibility Pro Plus"
            }
            totalAmount={amountNgn}
            subtotalAmount={subtotalNgn}
            walletApplied={displayWalletApplied}
            isVerification={isVerification}
            boostLine={null}
            beforePayButton={
              <div className="space-y-2">
                <WalletApplySection
                  subtotal={subtotalNgn}
                  applyWallet={applyWallet}
                  walletApplied={displayWalletApplied}
                  onApplyWalletChange={(next) => {
                    setApplyWallet(next);
                    setCheckoutPayment(null);
                    setWalletAppliedAmount(0);
                    setGatewayAmount(null);
                    setPaystackAccessCode(null);
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
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
