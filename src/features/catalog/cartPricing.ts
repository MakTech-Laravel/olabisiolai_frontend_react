/** Shown when any cart line is a "from" / estimate price (business confirms total). */
export const BUSINESS_PROVIDES_TOTAL_PRICE = 'Business will provide total price'

export function formatCartEstimatedTotalDisplay(
  estimatedTotalKobo: number | null,
  formatNaira: (kobo: number) => string,
): string {
  if (estimatedTotalKobo === null) return BUSINESS_PROVIDES_TOTAL_PRICE
  return formatNaira(estimatedTotalKobo)
}
