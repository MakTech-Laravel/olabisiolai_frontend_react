export type FlutterwaveCardPayload = {
  last_4digits?: string;
  last4digits?: string;
  type?: string;
  expirymonth?: string;
  expiryyear?: string;
};

export type FlutterwaveCallbackResponse = {
  status?: string;
  transaction_id?: string | number;
  id?: string | number;
  flw_ref?: string;
  tx_ref?: string;
  customer?: { email?: string; phone_number?: string; name?: string };
  card?: FlutterwaveCardPayload;
};

export function isFlutterwavePaymentSuccessful(response: FlutterwaveCallbackResponse): boolean {
  const status = (response.status ?? "").toLowerCase();
  return status === "successful" || status === "completed";
}

export function extractFlutterwaveTransactionId(
  response: FlutterwaveCallbackResponse,
): string | null {
  const candidates = [response.transaction_id, response.id, response.flw_ref];

  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) {
      continue;
    }
    const value = String(candidate).trim();
    if (value !== "") {
      return value;
    }
  }

  return null;
}

export type ExtractedCardMeta = {
  last_four: string | null;
  card_brand: string | null;
  exp_month: string | null;
  exp_year: string | null;
};

export function extractFlutterwaveCardMeta(response: FlutterwaveCallbackResponse): ExtractedCardMeta {
  const card = response.card;
  if (!card || typeof card !== 'object') {
    return { last_four: null, card_brand: null, exp_month: null, exp_year: null };
  }

  const lastRaw = card.last_4digits ?? card.last4digits;
  const last_four =
    lastRaw !== undefined && lastRaw !== null ? String(lastRaw).replace(/\D/g, '').slice(-4) : null;
  const last_fourNorm = last_four && last_four.length === 4 ? last_four : null;

  const exp_month = card.expirymonth ? String(card.expirymonth).padStart(2, '0').slice(-2) : null;
  const exp_year = card.expiryyear ? String(card.expiryyear).slice(-4) : null;
  const card_brand = card.type ? String(card.type).trim() : null;

  return { last_four: last_fourNorm, card_brand, exp_month, exp_year };
}
