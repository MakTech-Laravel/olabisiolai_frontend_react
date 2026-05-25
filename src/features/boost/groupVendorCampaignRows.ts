import type { BoostCampaignRow } from "@/features/boost/boostCampaignTypes";

export type BoostCampaignGroupRow = BoostCampaignRow & {
  history: BoostCampaignRow[];
  extension_count: number;
  total_duration_days: number;
};

function isExtensionRow(row: BoostCampaignRow, rows: BoostCampaignRow[]): boolean {
  if (row.is_extension_record) {
    return true;
  }

  if (row.display_status === "extension_merged" || row.is_extension_record) {
    return true;
  }

  if (row.renew_type === "extend" && row.source_campaign_id) {
    const parent = rows.find((entry) => entry.id === row.source_campaign_id);
    if (parent && row.display_status === "active" && parent.display_status === "active") {
      return true;
    }
  }

  return false;
}

function buildGroup(primary: BoostCampaignRow, history: BoostCampaignRow[]): BoostCampaignGroupRow {
  const views = (primary.views_count ?? 0) + history.reduce((sum, row) => sum + (row.views_count ?? 0), 0);
  const enquiries =
    (primary.enquiries_count ?? 0) + history.reduce((sum, row) => sum + (row.enquiries_count ?? 0), 0);
  const totalDurationDays =
    primary.duration_days + history.reduce((sum, row) => sum + row.duration_days, 0);

  return {
    ...primary,
    views_count: views,
    enquiries_count: enquiries,
    total_duration_days: totalDurationDays,
    extension_count: history.length,
    history: [...history].sort(
      (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
    ),
  };
}

/** Merge extend duplicates into one row per tier/location; pending rows stay separate. */
export function groupVendorCampaignRows(rows: BoostCampaignRow[]): BoostCampaignGroupRow[] {
  const extensionIds = new Set(rows.filter((row) => isExtensionRow(row, rows)).map((row) => row.id));

  const extensionsByParent = new Map<number, BoostCampaignRow[]>();
  for (const row of rows) {
    if (!extensionIds.has(row.id)) {
      continue;
    }

    const parentId = row.extension_parent_id ?? row.source_campaign_id;
    if (!parentId) {
      continue;
    }

    const list = extensionsByParent.get(parentId) ?? [];
    list.push(row);
    extensionsByParent.set(parentId, list);
  }

  const primaries = rows.filter((row) => !extensionIds.has(row.id));
  const nonActive: BoostCampaignGroupRow[] = [];
  const activeBuckets = new Map<string, BoostCampaignRow[]>();

  for (const row of primaries) {
    if (row.display_status === "active") {
      const key = `${row.tier_key}:${row.location?.id ?? 0}`;
      activeBuckets.set(key, [...(activeBuckets.get(key) ?? []), row]);
    } else {
      nonActive.push(buildGroup(row, extensionsByParent.get(row.id) ?? []));
    }
  }

  const activeGroups: BoostCampaignGroupRow[] = [];
  for (const bucket of activeBuckets.values()) {
    const sorted = [...bucket].sort(
      (a, b) => new Date(b.ends_at ?? 0).getTime() - new Date(a.ends_at ?? 0).getTime(),
    );
    const [primary, ...duplicateActives] = sorted;
    const linkedExtensions = extensionsByParent.get(primary.id) ?? [];
    activeGroups.push(buildGroup(primary, [...duplicateActives, ...linkedExtensions]));
  }

  const merged = [...activeGroups, ...nonActive];
  merged.sort(
    (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
  );

  return merged;
}
