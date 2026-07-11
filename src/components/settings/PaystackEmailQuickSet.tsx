import * as React from "react";
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { Mail } from "lucide-react";

import { setUserEmailForPurchase } from "@/api/userEmailVerification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getLaravelErrorMessage } from "@/lib/laravelApiError";

type Props = {
  settingsQueryKey: QueryKey;
  onSaved?: () => void;
};

export function PaystackEmailQuickSet({ settingsQueryKey, onSaved }: Props) {
  const queryClient = useQueryClient();
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (nextEmail: string) => setUserEmailForPurchase(nextEmail),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: settingsQueryKey });
      onSaved?.();
    },
    onError: (err) => {
      setError(getLaravelErrorMessage(err));
    },
  });

  function handleSubmit() {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }
    mutation.mutate(trimmed);
  }

  return (
    <div className="rounded-lg border p-4">
      <p className="mb-2 text-sm">
        Add an email address before paying with Paystack.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setError(null);
              setEmail(e.target.value);
            }}
            disabled={mutation.isPending}
            placeholder="you@example.com"
            className="h-11 bg-white pl-10 dark:bg-background"
            autoComplete="email"
          />
        </div>
        <Button
          type="button"
          size="sm"
          disabled={mutation.isPending || !email.trim()}
          onClick={handleSubmit}
          className="h-11"
        >
          {mutation.isPending ? "Saving..." : "Save email"}
        </Button>
      </div>
      {error ? (
        <p className="mt-2 text-sm text-red-700 dark:text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
