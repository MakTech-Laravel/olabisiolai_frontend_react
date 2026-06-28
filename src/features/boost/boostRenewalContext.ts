import type { BoostCampaignRow } from '@/features/boost/boostCampaignTypes'
import type { BoostRenewType } from '@/features/boost/vendorBoostApi'

export type BoostRenewalContext = {
  renewType: BoostRenewType
  sourceCampaignId: number
  locationId: string
  locationLabel: string
  tierKey: string
  tierLabel: string
}

export function buildBoostRenewalContext(
  row: BoostCampaignRow,
  renewType: BoostRenewType,
): BoostRenewalContext | null {
  if (!row.location?.id) {
    return null
  }

  return {
    renewType,
    sourceCampaignId: row.id,
    locationId: String(row.location.id),
    locationLabel: row.location.label,
    tierKey: row.tier_key,
    tierLabel: row.tier_label,
  }
}
