import { CreditCard, Landmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function PaymentMethodsCard({
  selectedMethod,
  onMethodChange,
}: {
  selectedMethod: "card" | "bank";
  onMethodChange: (method: "card" | "bank") => void;
}) {
  return (
    <>
      <h2 className="font-inter font-semibold text-base uppercase text-foreground">Payment Methods</h2>

      {/* Pay with Card */}
      <Card
        className={`cursor-pointer transition-colors ${selectedMethod === "card" ? "border-brand-red" : ""}`}
        onClick={() => onMethodChange("card")}
      >
        <CardContent className="flex items-center justify-between p-4">
          <div className="inline-flex items-center gap-3">
            <div className={`rounded-md p-2 ${selectedMethod === "card" ? "bg-red-50 text-brand-red" : "bg-slate-100 text-slate-700"}`}>
              <CreditCard className="w-10 h-10" />
            </div>
            <div>
              <p className="font-inter font-semibold text-sm text-foreground">Pay with Card</p>
              <p className="font-inter font-normal text-sm text-muted-foreground">
                Secure checkout via Flutterwave
              </p>
            </div>
          </div>
          {selectedMethod === "card" ? (
            <div className="border-2 border-brand-red rounded-full p-1">
              <div className="w-4 h-4 bg-brand-red rounded-full"></div>
            </div>
          ) : (
            <div className="size-6 rounded-full border" />
          )}
        </CardContent>
      </Card>

      {/* Bank Transfer */}
      <Card
        className={`cursor-pointer transition-colors bg-[#EFF4FF] ${selectedMethod === "bank" ? "border-brand-red" : ""}`}
        onClick={() => onMethodChange("bank")}
      >
        <CardContent className="flex items-center justify-between p-4">
          <div className="inline-flex items-center gap-3">
            <div className={`rounded-md p-2 ${selectedMethod === "bank" ? "bg-red-50 text-brand-red" : "bg-slate-100 text-slate-700"}`}>
              <Landmark className="size-4" />
            </div>
            <div>
              <p className="font-inter font-semibold text-sm text-foreground">Bank Transfer</p>
              <p className="font-inter font-normal text-sm text-muted-foreground">Direct deposit to Gidira accounts</p>
            </div>
          </div>
          {selectedMethod === "bank" ? (
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
