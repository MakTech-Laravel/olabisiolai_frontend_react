import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type BillingFormValues = {
  cardholder_name: string;
  email: string;
  phone: string;
  billing_line1: string;
  billing_city: string;
  billing_state: string;
  billing_country: string;
};

function patch(values: BillingFormValues, key: keyof BillingFormValues, v: string): BillingFormValues {
  return { ...values, [key]: v };
}

export function BillingInformationCard({
  value,
  onChange,
  editable = false,
  hint,
}: {
  value: BillingFormValues;
  onChange?: (next: BillingFormValues) => void;
  editable?: boolean;
  hint?: string | null;
}) {
  const set = (key: keyof BillingFormValues, v: string) => {
    if (onChange) onChange(patch(value, key, v));
  };

  return (
    <Card>
      <CardContent className="space-y-3 bg-[#EFF4FF] p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-inter text-base font-bold">Billing information</p>
        </div>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        {editable && onChange ? (
          <div className="space-y-2">
            <Input
              placeholder="Cardholder name"
              value={value.cardholder_name}
              onChange={(e) => set("cardholder_name", e.target.value)}
              className="bg-[#F6F6F6]"
            />
            <Input
              type="email"
              placeholder="Email"
              value={value.email}
              onChange={(e) => set("email", e.target.value)}
              className="bg-[#F6F6F6]"
            />
            <Input
              placeholder="Phone"
              value={value.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="bg-[#F6F6F6]"
            />
            <Input
              placeholder="Address line"
              value={value.billing_line1}
              onChange={(e) => set("billing_line1", e.target.value)}
              className="bg-[#F6F6F6]"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="City"
                value={value.billing_city}
                onChange={(e) => set("billing_city", e.target.value)}
                className="bg-[#F6F6F6]"
              />
              <Input
                placeholder="State / region"
                value={value.billing_state}
                onChange={(e) => set("billing_state", e.target.value)}
                className="bg-[#F6F6F6]"
              />
            </div>
            <Input
              placeholder="Country"
              value={value.billing_country}
              onChange={(e) => set("billing_country", e.target.value)}
              className="bg-[#F6F6F6]"
            />
          </div>
        ) : (
          <div className="space-y-1 text-sm">
            <p className="font-inter font-medium">{value.cardholder_name || "—"}</p>
            <p className="font-inter text-muted-foreground">{value.email || "—"}</p>
            <p className="font-inter text-muted-foreground">{value.phone || "—"}</p>
            <p className="font-inter">{value.billing_line1 || ""}</p>
            <p className="font-inter text-muted-foreground">
              {[value.billing_city, value.billing_state, value.billing_country].filter(Boolean).join(", ")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
