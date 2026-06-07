import type { BillingFormValues } from "@/components/sections/vendor/boost/boostPay/BillingInformationCard";
import type { VendorPaymentMethod } from "@/features/vendor/vendorPaymentsApi";

type UserLike = {
  email?: string | null;
  name?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  phone_number?: string | null;
};

export function billingFromUser(user: UserLike | null | undefined): BillingFormValues {
  const joined = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  const name = (user?.name ?? user?.full_name ?? joined) || "";
  const email = user?.email ?? "";
  const phone = user?.phone ?? user?.phone_number ?? "";

  return {
    cardholder_name: name,
    email,
    phone,
    billing_line1: "",
    billing_city: "",
    billing_state: "",
    billing_country: "Nigeria",
  };
}

export function billingFromVendorPaymentMethod(m: VendorPaymentMethod): BillingFormValues {
  return {
    cardholder_name: m.cardholder_name,
    email: m.email,
    phone: m.phone,
    billing_line1: m.billing_line1 ?? "",
    billing_city: m.billing_city ?? "",
    billing_state: m.billing_state ?? "",
    billing_country: m.billing_country ?? "Nigeria",
  };
}
