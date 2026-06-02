import { CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function PaymentMethodsCard({
  selectedGateway,
  onGatewayChange,
}: {
  selectedGateway: "flutterwave" | "paystack";
  onGatewayChange: (gateway: "flutterwave" | "paystack") => void;
}) {
  return (
    <>
      <h2 className="font-inter font-semibold text-base uppercase text-foreground">Payment Methods</h2>

      {/* Flutterwave */}
      <Card
        className={`cursor-pointer transition-colors ${selectedGateway === "flutterwave" ? "border-brand-red" : ""}`}
        onClick={() => onGatewayChange("flutterwave")}
      >
        <CardContent className="flex items-center justify-between p-4">
          <div className="inline-flex items-center gap-3">
            <div
              className={`rounded-md p-2 ${selectedGateway === "flutterwave" ? "bg-red-50 text-brand-red" : "bg-slate-100 text-slate-700"}`}
            >
              <CreditCard className="w-10 h-10" />
            </div>
            <div>
              <p className="font-inter font-semibold text-sm text-foreground">Flutterwave</p>
              <p className="font-inter font-normal text-sm text-muted-foreground">Secure card payment via Flutterwave</p>
            </div>
          </div>
          {selectedGateway === "flutterwave" ? (
            <div className="border-2 border-brand-red rounded-full p-1">
              <div className="w-4 h-4 bg-brand-red rounded-full"></div>
            </div>
          ) : (
            <div className="size-6 rounded-full border" />
          )}
        </CardContent>
      </Card>

      {/* Paystack */}
      <Card
        className={`cursor-pointer transition-colors bg-[#EFF4FF] ${selectedGateway === "paystack" ? "border-brand-red" : ""}`}
        onClick={() => onGatewayChange("paystack")}
      >
        <CardContent className="flex items-center justify-between p-4">
          <div className="inline-flex items-center gap-3">
            <div
              className={`rounded-md p-2 ${selectedGateway === "paystack" ? "bg-red-50 text-brand-red" : "bg-slate-100 text-slate-700"}`}
            >
              <CreditCard className="w-10 h-10" />
            </div>
            <div>
              <p className="font-inter font-semibold text-sm text-foreground">Paystack</p>
              <p className="font-inter font-normal text-sm text-muted-foreground">Secure card payment via Paystack</p>
            </div>
          </div>
          {selectedGateway === "paystack" ? (
            <div className="border-2 border-brand-red rounded-full p-1">
              <div className="w-4 h-4 bg-brand-red rounded-full"></div>
            </div>
          ) : (
            <div className="size-6 rounded-full border" />
          )}
        </CardContent>
      </Card>
    </>
  );
}
