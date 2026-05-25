import type { BoostCampaignRow } from "@/features/boost/boostCampaignTypes";

import { VendorBoostCampaignsTable } from "@/components/sections/vendor/boost/VendorBoostCampaignsTable";

type Props = {
  campaigns: BoostCampaignRow[];
  loading?: boolean;
  onExtendBoost?: (row: BoostCampaignRow) => void;
  onBoostAgain?: (row: BoostCampaignRow) => void;
  onContinuePayment?: (row: BoostCampaignRow) => void;
  groupExtensions?: boolean;
};

export function BoostPlanBenefits({
  campaigns,
  loading = false,
  onExtendBoost,
  onBoostAgain,
  onContinuePayment,
  groupExtensions = true,
}: Props) {
  return (
    <VendorBoostCampaignsTable
      rows={campaigns}
      loading={loading}
      title="Current Active Boosts"
      vendorActions
      groupExtensions={groupExtensions}
      onExtendBoost={onExtendBoost}
      onBoostAgain={onBoostAgain}
      onContinuePayment={onContinuePayment}
      emptyMessage="No boost campaigns yet. Select a plan above — admin will approve before it goes live."
    />
  );
}
