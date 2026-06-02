declare module "@paystack/inline-js" {
  type PaystackTransactionOptions = {
    key: string;
    email: string;
    amount: number;
    currency?: string;
    ref?: string;
    metadata?: unknown;
    callback?: (response: { reference?: string }) => void | Promise<void>;
    onClose?: () => void;
    [key: string]: unknown;
  };

  export default class PaystackPop {
    newTransaction(options: PaystackTransactionOptions): void;
  }
}

