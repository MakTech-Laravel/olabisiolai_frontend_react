export type PaymentStatus = "completed" | "pending" | "failed";
export type PaymentMethod = "card" | "bank_transfer" | "wallet";

export type PaymentRow = {
  id: number;
  business: string;
  payerName: string;
  payerEmail: string;
  reference: string;
  amountNgn: number;
  method: PaymentMethod;
  status: PaymentStatus;
  dateShort: string;
  dateTimeLong: string;
};

export type PaymentStatusFilter = "all" | PaymentStatus;
