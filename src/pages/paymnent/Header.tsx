import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createVendorPaymentMethod } from "@/features/vendor/vendorPaymentsApi";
import { getLaravelErrorMessage } from "@/lib/laravelApiError";
import { showError, showSuccess } from "@/lib/sweetAlert";
import { CheckCircle2, X } from "lucide-react";

type ModalStep = "none" | "form" | "success";

export function PaymentHeader() {
  const qc = useQueryClient();
  const [modalStep, setModalStep] = useState<ModalStep>("none");
  const [label, setLabel] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [cardBrand, setCardBrand] = useState("");
  const [billingLine1, setBillingLine1] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingCountry, setBillingCountry] = useState("Nigeria");
  const [makeDefault, setMakeDefault] = useState(true);

  const saveMutation = useMutation({
    mutationFn: () =>
      createVendorPaymentMethod({
        label: label.trim() || null,
        cardholder_name: cardholderName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        last_four: lastFour.replace(/\D/g, "").length === 4 ? lastFour.replace(/\D/g, "").slice(-4) : null,
        card_brand: cardBrand.trim() || null,
        billing_line1: billingLine1.trim() || null,
        billing_city: billingCity.trim() || null,
        billing_state: billingState.trim() || null,
        billing_country: billingCountry.trim() || null,
        is_default: makeDefault,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["vendor", "payment-methods"] });
      setModalStep("success");
      showSuccess("Saved checkout profile added.");
    },
    onError: (e) => showError(getLaravelErrorMessage(e, "Could not save profile.")),
  });

  const resetForm = () => {
    setLabel("");
    setCardholderName("");
    setEmail("");
    setPhone("");
    setLastFour("");
    setCardBrand("");
    setBillingLine1("");
    setBillingCity("");
    setBillingState("");
    setBillingCountry("Nigeria");
    setMakeDefault(true);
  };

  const openForm = () => {
    resetForm();
    setModalStep("form");
  };

  const closeAll = () => {
    setModalStep("none");
    resetForm();
  };

  return (
    <div>
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-inter text-xl font-bold">Saved checkout profiles</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Store billing details and optional masked card info (last 4 digits only). Full card numbers are never stored
            on our servers.
          </p>
        </div>
        <button
          type="button"
          className="cursor-pointer font-inter text-sm font-semibold text-brand-red hover:underline"
          onClick={openForm}
        >
          + Add saved profile
        </button>
      </header>
      {modalStep !== "none" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <Card className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-[#EFF6FF] p-4 sm:p-5">
            <CardContent className="relative w-full space-y-4 sm:space-y-6">
              <button
                type="button"
                className="absolute right-0 top-0 rounded-full border p-1 text-muted-foreground"
                onClick={closeAll}
              >
                <X className="size-4" />
              </button>

              {modalStep === "form" ? (
                <>
                  <p className="pr-8 font-inter text-lg font-semibold">Add saved profile</p>
                  <Input placeholder="Label (e.g. Work card)" value={label} onChange={(e) => setLabel(e.target.value)} />
                  <Input
                    placeholder="Cardholder name *"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    className="bg-[#F6F6F6]"
                  />
                  <Input
                    type="email"
                    placeholder="Email *"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#F6F6F6]"
                  />
                  <Input
                    placeholder="Phone *"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-[#F6F6F6]"
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="Last 4 digits (optional)"
                      value={lastFour}
                      onChange={(e) => setLastFour(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      className="bg-[#F6F6F6]"
                    />
                    <Input
                      placeholder="Brand (e.g. Visa)"
                      value={cardBrand}
                      onChange={(e) => setCardBrand(e.target.value)}
                      className="bg-[#F6F6F6]"
                    />
                  </div>
                  <Input
                    placeholder="Address line"
                    value={billingLine1}
                    onChange={(e) => setBillingLine1(e.target.value)}
                    className="bg-[#F6F6F6]"
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="City"
                      value={billingCity}
                      onChange={(e) => setBillingCity(e.target.value)}
                      className="bg-[#F6F6F6]"
                    />
                    <Input
                      placeholder="State"
                      value={billingState}
                      onChange={(e) => setBillingState(e.target.value)}
                      className="bg-[#F6F6F6]"
                    />
                  </div>
                  <Input
                    placeholder="Country"
                    value={billingCountry}
                    onChange={(e) => setBillingCountry(e.target.value)}
                    className="bg-[#F6F6F6]"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={makeDefault}
                      onChange={(e) => setMakeDefault(e.target.checked)}
                      className="size-4 rounded border"
                    />
                    Set as default checkout profile
                  </label>
                  <Button
                    className="w-full bg-brand-red text-white hover:bg-brand-red/90"
                    disabled={saveMutation.isPending}
                    onClick={() => {
                      if (!cardholderName.trim() || !email.trim() || !phone.trim()) {
                        showError("Name, email, and phone are required.");
                        return;
                      }
                      saveMutation.mutate();
                    }}
                  >
                    {saveMutation.isPending ? "Saving…" : "Save profile"}
                  </Button>
                </>
              ) : null}

              {modalStep === "success" ? (
                <>
                  <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                    <CheckCircle2 className="size-8" />
                  </div>
                  <h3 className="text-center font-inter text-xl font-semibold">Profile saved</h3>
                  <p className="text-center text-sm text-muted-foreground">
                    You can select this profile on checkout pages to autofill billing details.
                  </p>
                  <Button
                    className="w-full bg-brand-red text-white hover:bg-brand-red/90"
                    onClick={() => {
                      closeAll();
                    }}
                  >
                    Close
                  </Button>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
