import { TransactionHistory } from "../paymnent/TransactionHistory";
import { PaymentMethoad } from "../paymnent/PaymentMethoad";
import { PaymentHeader } from "../paymnent/Header";

export default function VendorPayments() {
  return (
    <div className="container mx-auto p-2 md:p-4">
      <div className="space-y-4">
        <PaymentHeader />

        <PaymentMethoad />
        <TransactionHistory />
      </div>
    </div>
  );
}
