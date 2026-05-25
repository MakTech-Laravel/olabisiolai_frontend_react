/** Nigerian Naira — single source for display across the app. */
export const CURRENCY_CODE = "NGN" as const;
export const CURRENCY_SYMBOL = "₦" as const;

export type FormatNairaOptions = {
  /** When amount is 0 or invalid, return "Free" instead of ₦0. Default true. */
  freeLabel?: boolean;
};

/**
 * Format an amount as Nigerian Naira with the ₦ symbol (not "NGN" text).
 */
export function formatNaira(amount: number, options?: FormatNairaOptions): string {
  const showFree = options?.freeLabel !== false;
  if (!Number.isFinite(amount) || amount <= 0) {
    return showFree ? "Free" : `${CURRENCY_SYMBOL}0`;
  }

  try {
    return `${CURRENCY_SYMBOL}${new Intl.NumberFormat("en-NG").format(Math.round(amount))}`;
  } catch {
    return `${CURRENCY_SYMBOL}${Math.round(amount).toLocaleString("en-NG")}`;
  }
}

/**
 * Format money for UI. NGN (and unknown) always use ₦; other ISO codes fall back to code + amount.
 */
export function formatMoney(amount: number, currency: string = CURRENCY_CODE): string {
  const code = currency.trim().toUpperCase() || CURRENCY_CODE;
  if (code === CURRENCY_CODE) {
    return formatNaira(amount, { freeLabel: false });
  }

  try {
    const formatted = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: code,
    }).format(amount);
    if (formatted.includes("NGN")) {
      return formatNaira(amount, { freeLabel: false });
    }
    return formatted;
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

export function formatNairaRange(min: number, max: number): string {
  if (min === max) {
    return formatNaira(min);
  }
  return `${formatNaira(min)} – ${formatNaira(max)}`;
}
