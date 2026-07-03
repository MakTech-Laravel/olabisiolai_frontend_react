import { CreditCard, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { fetchUserWallet } from "@/api/wallet";
import { formatNaira } from "@/lib/currency";

export type CheckoutGateway = "flutterwave" | "paystack" | "wallet";

export function PaymentMethodsCard({
  selectedGateway,
  onGatewayChange,
  totalAmount = 0,
}: {
  selectedGateway: CheckoutGateway;
  onGatewayChange: (gateway: CheckoutGateway) => void;
  totalAmount?: number;
}) {
  const { data: wallet } = useQuery({
    queryKey: ["user", "wallet"],
    queryFn: fetchUserWallet,
    staleTime: 15_000,
  });

  const walletBalance = wallet?.balance ?? 0;
  const canPayWithWallet = totalAmount > 0 && walletBalance >= totalAmount;

  return (
    <>
      <h2 className="font-inter font-semibold text-base uppercase text-foreground">Payment Methods</h2>

      {/* Gidira Wallet */}
      <Card
        className={`transition-colors ${selectedGateway === "wallet" ? "border-brand-red" : ""} ${
          canPayWithWallet ? "cursor-pointer" : "cursor-not-allowed opacity-60"
        }`}
        onClick={() => canPayWithWallet && onGatewayChange("wallet")}
      >
        <CardContent className="flex items-center justify-between p-4">
          <div className="inline-flex items-center gap-3">
            <div
              className={`rounded-md p-2 ${selectedGateway === "wallet" ? "bg-red-50 text-brand-red" : "bg-slate-100 text-slate-700"}`}
            >
              <Wallet className="w-10 h-10" />
            </div>
            <div>
              <p className="font-inter font-semibold text-sm text-foreground">Gidira Wallet</p>
              <p className="font-inter font-normal text-sm text-muted-foreground">
                {canPayWithWallet
                  ? `Balance: ${formatNaira(walletBalance, { freeLabel: false })}`
                  : `Insufficient balance (${formatNaira(walletBalance, { freeLabel: false })} available)`}
              </p>
            </div>
          </div>
          {selectedGateway === "wallet" ? (
            <div className="border-2 border-brand-red rounded-full p-1">
              <div className="w-4 h-4 bg-brand-red rounded-full"></div>
            </div>
          ) : (
            <div className="size-6 rounded-full border" />
          )}
        </CardContent>
      </Card>

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
