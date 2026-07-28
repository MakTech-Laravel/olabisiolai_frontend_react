import { cn } from '@/lib/utils'
import {
  formatCatalogPrice,
  formatNairaFromKobo,
  type BusinessCatalogItem,
} from '@/features/catalog/businessCatalogApi'

type CatalogPriceFields = Pick<
  BusinessCatalogItem,
  'priceKobo' | 'originalPriceKobo' | 'priceLabel' | 'priceFrom' | 'hasDiscount'
>

type CatalogPriceDisplayProps = {
  item: CatalogPriceFields
  className?: string
  saleClassName?: string
  originalClassName?: string
  align?: 'start' | 'end'
}

/** Sale price + strikethrough original when discounted; otherwise a single formatted price. */
export function CatalogPriceDisplay({
  item,
  className,
  saleClassName,
  originalClassName,
  align = 'start',
}: CatalogPriceDisplayProps) {
  const hasDual =
    item.hasDiscount &&
    item.priceKobo !== null &&
    item.priceKobo >= 0 &&
    item.originalPriceKobo !== null &&
    item.originalPriceKobo > item.priceKobo &&
    !item.priceFrom

  if (hasDual) {
    return (
      <span
        className={cn(
          'inline-flex flex-col gap-0.5',
          align === 'end' ? 'items-end text-right' : 'items-start text-left',
          className,
        )}
      >
        <span className={cn('font-bold tabular-nums text-ink', saleClassName)}>
          {formatNairaFromKobo(item.priceKobo!)}
        </span>
        <span
          className={cn(
            'text-sm tabular-nums text-stat-muted line-through',
            originalClassName,
          )}
        >
          {formatNairaFromKobo(item.originalPriceKobo!)}
        </span>
      </span>
    )
  }

  return (
    <span className={cn('tabular-nums', className)}>{formatCatalogPrice(item)}</span>
  )
}

type CartLinePriceDisplayProps = {
  saleDisplay: string
  originalUnitPriceKobo: number | null
  quantity: number
  hasDiscount?: boolean
  className?: string
}

/** Cart / sent-cart line: sale line total + strikethrough original line total. */
export function CartLinePriceDisplay({
  saleDisplay,
  originalUnitPriceKobo,
  quantity,
  hasDiscount = false,
  className,
}: CartLinePriceDisplayProps) {
  const showOriginal =
    hasDiscount &&
    originalUnitPriceKobo !== null &&
    originalUnitPriceKobo > 0 &&
    quantity > 0

  if (!showOriginal) {
    return <span className={cn('tabular-nums', className)}>{saleDisplay}</span>
  }

  return (
    <span className={cn('inline-flex flex-col items-end gap-0.5 text-right', className)}>
      <span className="font-semibold tabular-nums text-ink">{saleDisplay}</span>
      <span className="text-sm tabular-nums text-stat-muted line-through">
        {formatNairaFromKobo(originalUnitPriceKobo * quantity)}
      </span>
    </span>
  )
}
