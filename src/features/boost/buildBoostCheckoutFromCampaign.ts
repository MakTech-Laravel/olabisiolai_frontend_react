import type { BoostCampaignRow } from '@/features/boost/boostCampaignTypes'
import type { BoostCheckoutSelection } from '@/features/boost/boostCheckoutSession'
import type { BoostRenewType } from '@/features/boost/vendorBoostApi'

function resolveDailyBudget(row: BoostCampaignRow): number {
  const metadata = row.metadata ?? {}
  const dailyFromMeta = Number(metadata.daily_budget)

  if (Number.isFinite(dailyFromMeta) && dailyFromMeta > 0) {
    return dailyFromMeta
  }

  if (row.duration_days > 0 && row.amount > 0) {
    return row.amount / row.duration_days
  }

  return row.amount
}

export function buildBoostCheckoutFromCampaign(row: BoostCampaignRow): BoostCheckoutSelection {
  const renewType =
    row.renew_type === 'extend' || row.renew_type === 'boost_again'
      ? (row.renew_type as BoostRenewType)
      : undefined

  return {
    locationId: String(row.location?.id ?? ''),
    locationLabel: row.location?.label ?? '',
    tierKey: row.tier_key,
    tierLabel: row.tier_label,
    durationDays: row.duration_days,
    amount: row.amount,
    budgetAmount: resolveDailyBudget(row),
    paymentId: row.payment_id ?? undefined,
    requestId: row.id,
    renewType,
    sourceCampaignId: row.source_campaign_id ?? undefined,
  }
}
