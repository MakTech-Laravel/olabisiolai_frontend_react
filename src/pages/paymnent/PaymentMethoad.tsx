import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  deleteVendorPaymentMethod,
  fetchVendorPaymentMethods,
  setDefaultVendorPaymentMethod,
  type VendorPaymentMethod,
} from "@/features/vendor/vendorPaymentsApi";
import { getLaravelErrorMessage } from "@/lib/laravelApiError";
import { showError, showSuccess } from "@/lib/sweetAlert";
import { CreditCard, Loader2, Star, Trash2 } from "lucide-react";

const PAYMENT_METHODS_QUERY_KEY = ["vendor", "payment-methods"] as const;

function mapDefaultExclusive(items: VendorPaymentMethod[], defaultId: number): VendorPaymentMethod[] {
  return items.map((item) => ({
    ...item,
    is_default: item.id === defaultId,
  }));
}

function maskLine(m: VendorPaymentMethod) {
  if (m.last_four) {
    return `${m.card_brand ?? "Card"} •••• ${m.last_four}`;
  }
  return "Billing profile (no masked card on file)";
}

export function PaymentMethoad() {
  const qc = useQueryClient();
  const { data, isPending, isError } = useQuery({
    queryKey: PAYMENT_METHODS_QUERY_KEY,
    queryFn: fetchVendorPaymentMethods,
  });

  const items = data?.items ?? [];

  const defaultMutation = useMutation({
    mutationFn: (id: number) => setDefaultVendorPaymentMethod(id),
    onMutate: async (id: number) => {
      await qc.cancelQueries({ queryKey: PAYMENT_METHODS_QUERY_KEY });
      const previous = qc.getQueryData<{ items: VendorPaymentMethod[] }>(PAYMENT_METHODS_QUERY_KEY);
      if (previous?.items) {
        qc.setQueryData(PAYMENT_METHODS_QUERY_KEY, {
          items: mapDefaultExclusive(previous.items, id),
        });
      }
      return { previous };
    },
    onError: (e, _id, context) => {
      if (context?.previous) {
        qc.setQueryData(PAYMENT_METHODS_QUERY_KEY, context.previous);
      }
      showError(getLaravelErrorMessage(e, "Could not update default."));
    },
    onSuccess: () => {
      showSuccess("Default profile updated.");
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: PAYMENT_METHODS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteVendorPaymentMethod(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: PAYMENT_METHODS_QUERY_KEY });
      showSuccess("Profile removed.");
    },
    onError: (e) => showError(getLaravelErrorMessage(e, "Could not remove profile.")),
  });

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {isPending ? (
        <div className="col-span-full flex items-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
          Loading saved profiles…
        </div>
      ) : null}
      {isError ? (
        <p className="col-span-full text-sm text-destructive">Could not load saved payment profiles.</p>
      ) : null}
      {!isPending && items.length === 0 ? (
        <p className="col-span-full rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No saved checkout profiles yet. Use &quot;Add saved profile&quot; above, or save one automatically after a
          successful card payment.
        </p>
      ) : null}
      {items.map((m) => (
        <Card key={m.id}>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-3">
              <div className="rounded-md bg-[#E5EEFF] p-2 text-muted-foreground">
                <CreditCard className="size-6" />
              </div>
              <div>
                <p className="font-inter text-sm font-bold">{m.label ?? m.card_brand ?? "Saved profile"}</p>
                <p className="font-inter text-sm text-foreground">{m.cardholder_name}</p>
                <p className="font-inter text-xs text-muted-foreground">{maskLine(m)}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {m.is_default ? (
                <Badge className="bg-[#0078B233] text-[#004B71] hover:bg-sky-100">Default</Badge>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={defaultMutation.isPending}
                  onClick={() => defaultMutation.mutate(m.id)}
                >
                  <Star className="size-3.5" />
                  Set default
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-rose-600 hover:text-rose-700"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(m.id)}
                aria-label="Remove profile"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
