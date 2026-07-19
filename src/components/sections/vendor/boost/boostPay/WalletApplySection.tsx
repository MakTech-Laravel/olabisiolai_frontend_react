import { Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchUserWallet } from "@/api/wallet";
import { formatNaira } from "@/lib/currency";

export function WalletApplySection({
  subtotal,
  applyWallet,
  onApplyWalletChange,
  walletApplied,
}: {
  subtotal: number;
  applyWallet: boolean;
  onApplyWalletChange: (apply: boolean) => void;
  walletApplied?: number;
}) {
  const { data: wallet, isLoading } = useQuery({
    queryKey: ["user", "wallet"],
    queryFn: () => fetchUserWallet(),
    staleTime: 15_000,
  });

  const walletBalance = wallet?.balance ?? 0;
  const canApply = subtotal > 0 && walletBalance > 0;
  const appliedAmount = applyWallet ? (walletApplied ?? Math.min(walletBalance, subtotal)) : 0;

  if (!canApply && !isLoading) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border-light bg-muted/20 p-3">
      <label
        className={`flex cursor-pointer items-start gap-3 ${canApply ? "" : "cursor-not-allowed opacity-60"}`}
      >
        <input
          type="checkbox"
          className="mt-1 size-4 rounded border"
          checked={applyWallet}
          disabled={!canApply || isLoading}
          onChange={(e) => onApplyWalletChange(e.target.checked)}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Wallet className="size-4 text-brand-red" />
            Apply Gidira Wallet balance
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            {isLoading
              ? "Loading wallet balance…"
              : `Available: ${formatNaira(walletBalance, { freeLabel: false })}`}
            {applyWallet && appliedAmount > 0
              ? ` · ${formatNaira(appliedAmount, { freeLabel: false })} will be deducted before card payment.`
              : null}
          </span>
        </span>
      </label>
    </div>
  );
}
