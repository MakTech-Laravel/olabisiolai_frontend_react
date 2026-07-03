import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchVendorPaymentDetail } from "@/features/vendor/vendorPaymentsApi";
import { formatMoney } from "@/lib/currency";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function VendorPaymentDetailPage() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const id = Number(paymentId);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["vendor", "payments", id],
    queryFn: () => fetchVendorPaymentDetail(id),
    enabled: Number.isFinite(id) && id > 0,
  });

  const p = data?.payment;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild className="gap-2 px-0 text-brand-red hover:text-brand-red">
          <Link to="/vendor/payments">
            <ArrowLeft className="size-4" />
            Back to payments
          </Link>
        </Button>
      </div>

      {isPending ? (
        <div className="flex items-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
          Loading…
        </div>
      ) : null}

      {isError || !p ? (
        <p className="text-sm text-destructive">
          {!Number.isFinite(id) || id <= 0
            ? "Invalid payment link."
            : (error as Error)?.message ?? "Payment not found."}
        </p>
      ) : null}

      {p ? (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div>
              <h1 className="font-inter text-2xl font-bold">Payment details</h1>
              <p className="text-sm text-muted-foreground">Reference #{p.id}</p>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Reference type</dt>
                <dd className="font-medium capitalize">{p.reference_type ?? p.purpose}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Purpose</dt>
                <dd className="font-medium">{p.purpose_label}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Status</dt>
                <dd className="font-medium capitalize">{p.status}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Gateway</dt>
                <dd className="font-medium capitalize">
                  {p.gateway === "paystack"
                    ? "Paystack"
                    : p.gateway === "flutterwave"
                      ? "Flutterwave"
                      : p.gateway === "wallet"
                        ? "Gidira Wallet"
                        : "—"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Description</dt>
                <dd className="font-medium">{p.description}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Amount</dt>
                <dd className="text-lg font-bold text-brand-red">{formatMoney(p.amount, p.currency)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Paid at</dt>
                <dd className="font-medium">{p.paid_at ?? "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Transaction reference (tx_ref)</dt>
                <dd className="break-all font-mono text-sm">{p.tx_ref}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Gateway transaction id</dt>
                <dd className="break-all font-mono text-sm">{p.gateway_transaction_id ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Package id</dt>
                <dd className="font-mono text-sm">{p.package_id ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Consumed</dt>
                <dd className="font-medium">{p.is_consumed ? "Yes" : "No"}</dd>
              </div>
            </dl>
            {p.metadata && Object.keys(p.metadata).length > 0 ? (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Metadata</p>
                <pre className="max-h-48 overflow-auto rounded-md bg-muted/40 p-3 text-xs">
                  {JSON.stringify(p.metadata, null, 2)}
                </pre>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
