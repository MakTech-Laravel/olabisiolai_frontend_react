import { TransactionHistory } from "../paymnent/TransactionHistory";
import { PaymentMethoad } from "../paymnent/PaymentMethoad";
import { PaymentHeader } from "../paymnent/Header";

export default function VendorPayments() {
  return (
    <div className="p-4 md:p-6">
      <div className="space-y-4">
        <PaymentHeader />

        <PaymentMethoad />
        <TransactionHistory />
      </div>
    </div>
  );
}
