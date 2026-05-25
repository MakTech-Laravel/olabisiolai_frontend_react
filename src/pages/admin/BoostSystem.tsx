import { ChevronDown, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { BoostWaitingList } from "@/components/sections/admin/boost/BoostWaitingList";
import { VendorBoostCampaignsTable } from "@/components/sections/vendor/boost/VendorBoostCampaignsTable";
import { fetchAdminBoostCampaigns } from "@/features/boost/adminBoostRequestsApi";
import { groupVendorCampaignRows } from "@/features/boost/groupVendorCampaignRows";
import { formatCompactCount } from "@/features/boost/boostCampaignTypes";
import { formatNaira } from "@/lib/currency";

type SlotOption = { label: string; value: string; max: number };

const SLOT_OPTIONS: SlotOption[] = [
  { label: "Top 1", value: "1", max: 1 },
  { label: "Top 5", value: "5", max: 5 },
  { label: "Top 10", value: "10", max: 10 },
];

const BOOST_PLANS = [
  {
    medal: "🥉",
    title: "Top 10 Boost",
    subtitle: "Affordable visibility for growing businesses",
    prices: [
      { days: "7 Days", amount: "₦3,000" },
      { days: "14 Days", amount: "₦5,000" },
      { days: "30 Days", amount: "₦10,000" },
    ],
    slotNote: "10 slots available in this LGA",
    features: [
      "Appear in Top 10 in your LGA",
      "Boost badge on listing",
      "Increased visibility & inquiries",
    ],
    cta: "Boost with Bronze",
    cardClass: "border-[#f0d6bd] bg-[#fff6eb]",
    ctaClass: "bg-[#8d4a1a] text-white hover:bg-[#7a3f16]",
    slotClass: "text-[#c77b38]",
  },
  {
    medal: "🥈",
    title: "Top 5 Boost",
    subtitle: "Higher visibility for competitive LGAs",
    prices: [
      { days: "7 Days", amount: "₦5,000" },
      { days: "14 Days", amount: "₦10,000" },
      { days: "30 Days", amount: "₦15,000" },
    ],
    slotNote: "5 slots available in this LGA",
    features: [
      "Guaranteed Top 5 placement",
      "Higher ranking than Bronze",
      "Boost badge & strong visibility",
    ],
    cta: "Boost with Silver",
    cardClass: "border-[#d9dee8] bg-[#f5f7fb]",
    ctaClass: "bg-[#364152] text-white hover:bg-[#2c3544]",
    slotClass: "text-[#5f6b7a]",
  },
  {
    medal: "🥇",
    title: "Top 1 Exclusive",
    subtitle: "The #1 spot reserved for one business per LGA",
    prices: [
      { days: "7 Days", amount: "₦10,000" },
      { days: "14 Days", amount: "₦15,000" },
      { days: "30 Days", amount: "₦20,000" },
    ],
    slotNote: "Slot currently occupied",
    features: [
      "Guaranteed #1 position",
      "Exclusive - one per LGA",
      "Spotlight badge & 10x more reach",
      "Premium vendors get first access",
    ],
    cta: "Join Waiting List",
    cardClass: "border-[#f2dd8b] bg-[#fffbe6]",
    ctaClass: "bg-[#c89c2a] text-white hover:bg-[#b48822]",
    slotClass: "text-[#c89c2a]",
    tag: "Most Popular",
  },
] as const;

export default function BoostSystem() {
  const [slotOpen, setSlotOpen] = useState(false);
  const [slotValue, setSlotValue] = useState("10");
  const [selectedLga, setSelectedLga] = useState("");

  const { data: campaigns = [], isPending: campaignsLoading } = useQuery({
    queryKey: ["admin", "boost-requests", "campaigns"],
    queryFn: () => fetchAdminBoostCampaigns(),
    staleTime: 15_000,
  });

  const groupedCampaigns = useMemo(() => groupVendorCampaignRows(campaigns), [campaigns]);

  const activeCampaigns = useMemo(
    () => groupedCampaigns.filter((row) => row.display_status === "active"),
    [groupedCampaigns],
  );

  const activeCampaignCount = activeCampaigns.length;

  const overview = useMemo(() => {
    const totalViews = activeCampaigns.reduce((sum, row) => sum + (row.views_count ?? 0), 0);
    const totalEnquiries = activeCampaigns.reduce((sum, row) => sum + (row.enquiries_count ?? 0), 0);
    const paidCampaigns = groupedCampaigns.filter((row) => row.status === "approved" || row.display_status === "active" || row.display_status === "expired");
    const totalRevenue = paidCampaigns.reduce((sum, row) => sum + row.amount, 0);
    const avgDuration =
      paidCampaigns.length > 0
        ? Math.round(paidCampaigns.reduce((sum, row) => sum + row.duration_days, 0) / paidCampaigns.length)
        : 0;

    return { totalViews, totalEnquiries, totalRevenue, avgDuration };
  }, [activeCampaigns, groupedCampaigns]);

  const activeByLga = useMemo(() => {
    const map = new Map<string, typeof activeCampaigns>();
    for (const row of activeCampaigns) {
      const lga = row.location?.lga ?? "Unknown";
      map.set(lga, [...(map.get(lga) ?? []), row]);
    }
    return map;
  }, [activeCampaigns]);

  const lgaOptions = useMemo(
    () => Array.from(activeByLga.keys()).sort(),
    [activeByLga],
  );

  const resolvedLga = selectedLga || lgaOptions[0] || "";
  const activeInSelectedLga = activeByLga.get(resolvedLga) ?? [];

  const slotOption = useMemo(
    () => SLOT_OPTIONS.find((option) => option.value === slotValue) ?? SLOT_OPTIONS[0],
    [slotValue],
  );
  const activeCount = activeInSelectedLga.length;
  const slotLabel = useMemo(() => `Top ${slotOption.value}`, [slotOption.value]);
  const atSlotCapacity = activeCount >= slotOption.max;

  function exportTrackingCsv() {
    const headers = [
      "Business",
      "Vendor",
      "LGA",
      "Tier",
      "Status",
      "Duration Days",
      "Views",
      "Enquiries",
      "Amount",
      "Starts",
      "Ends",
    ];
    const csvLines = [
      headers.join(","),
      ...groupedCampaigns.map((row) =>
        [
          row.business?.business_name ?? "",
          row.business?.vendor_name ?? "",
          row.location?.lga ?? "",
          row.tier_label,
          row.display_status_label,
          row.duration_days,
          row.views_count ?? 0,
          row.enquiries_count ?? 0,
          row.amount,
          row.starts_at ?? "",
          row.ends_at ?? "",
        ]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ];
    const blob = new Blob([`\uFEFF${csvLines.join("\r\n")}`], { type: "text/csv;charset=utf-8;" });
    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `boost-campaigns-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold leading-tight text-ink-heading sm:text-3xl">Boost System</h1>
      </div>

      <section className="mb-4 rounded-2xl border border-chat-border-subtle bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-chat-accent">Boost Overview</p>
        <h2 className="text-xl font-semibold text-ink">Boost System</h2>
        <p className="text-sm text-chat-meta">
          Live metrics from profile visits and customer messages during each campaign window
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-chat-border-subtle bg-background p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-chat-meta">Active Boosts</p>
            <p className="mt-1 text-4xl font-semibold leading-10 text-ink">{activeCampaignCount}</p>
          </article>
          <article className="rounded-xl border border-chat-border-subtle bg-background p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-chat-meta">Profile Views</p>
            <p className="mt-1 text-4xl font-semibold leading-10 text-ink">
              {formatCompactCount(overview.totalViews)}
            </p>
            <p className="text-xs font-medium text-body-secondary">Active campaigns</p>
          </article>
          <article className="rounded-xl border border-chat-border-subtle bg-background p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-chat-meta">Enquiries</p>
            <p className="mt-1 text-4xl font-semibold leading-10 text-ink">{overview.totalEnquiries}</p>
            <p className="text-xs font-medium text-body-secondary">Customer messages</p>
          </article>
          <article className="rounded-xl border border-chat-border-subtle bg-background p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-chat-meta">Campaign Revenue</p>
            <p className="mt-1 text-3xl font-semibold leading-10 text-ink">
              {formatNaira(overview.totalRevenue, { freeLabel: false })}
            </p>
            <p className="text-xs font-medium text-body-secondary">Avg {overview.avgDuration} day plans</p>
          </article>
        </div>
      </section>

      <section className="mb-4 rounded-2xl border border-chat-border-subtle bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-ink">Boost Plans</h3>
          <button
            type="button"
            onClick={exportTrackingCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-border-gray bg-background px-3 py-2 text-xs font-semibold text-ink hover:bg-muted"
          >
            <Download className="size-4" />
            Export campaigns CSV
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {BOOST_PLANS.map((plan) => (
            <article key={plan.title} className={`rounded-xl border p-4 ${plan.cardClass}`}>
              <div className="mb-2">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm" aria-hidden>
                    {plan.medal}
                  </span>
                  {"tag" in plan ? (
                    <span className="rounded-full bg-[#ffe8a3] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#b47d00]">
                      {plan.tag}
                    </span>
                  ) : null}
                </div>
                <h4 className="text-sm font-semibold text-ink">{plan.title}</h4>
                <p className="text-[11px] text-body-secondary">{plan.subtitle}</p>
              </div>
              <div className="space-y-1.5">
                {plan.prices.map((price) => (
                  <div
                    key={price.days}
                    className="flex items-center justify-between rounded-md border border-border-gray bg-white px-2.5 py-1.5 text-xs"
                  >
                    <span className="text-body-secondary">{price.days}</span>
                    <span className="font-semibold text-ink">{price.amount}</span>
                  </div>
                ))}
              </div>
              <p className={`mt-2 text-[11px] font-semibold ${plan.slotClass}`}>* {plan.slotNote}</p>
              <ul className="mt-2 space-y-1.5 text-[11px] text-body-secondary">
                {plan.features.map((feature) => (
                  <li key={feature}>- {feature}</li>
                ))}
              </ul>
              <button type="button" className={`mt-3 w-full rounded-md px-3 py-1.5 text-xs font-semibold ${plan.ctaClass}`}>
                {plan.cta}
              </button>
            </article>
          ))}
        </div>
      </section>

      {lgaOptions.length > 0 ? (
        <section className="mb-4 rounded-2xl border border-chat-border-subtle bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-ink">LGA Slot Manager</h3>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-chat-meta">LGA</label>
              <select
                value={resolvedLga}
                onChange={(event) => setSelectedLga(event.target.value)}
                className="h-9 rounded-lg border border-border-gray bg-background px-3 text-sm text-ink"
              >
                {lgaOptions.map((lga) => (
                  <option key={lga} value={lga}>
                    {lga}
                  </option>
                ))}
              </select>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSlotOpen((open) => !open)}
                  className="inline-flex h-9 min-w-28 items-center justify-between gap-2 rounded-lg border border-border-gray bg-background px-3 text-sm font-medium text-ink"
                >
                  {slotLabel}
                  <ChevronDown className="size-4 shrink-0 text-body-secondary" />
                </button>
                {slotOpen ? (
                  <div className="absolute left-0 z-20 mt-1 w-full min-w-28 overflow-hidden rounded-lg border border-border-gray bg-card py-1 shadow-md">
                    {SLOT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSlotValue(opt.value);
                          setSlotOpen(false);
                        }}
                        className="flex w-full px-3 py-2 text-left text-sm text-ink hover:bg-muted"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-chat-border-subtle bg-background px-3 py-2 text-sm">
            <span className="font-semibold text-ink">{resolvedLga}</span>: {activeCount}/{slotOption.max} slots used —{" "}
            <span className={atSlotCapacity ? "font-semibold text-brand-red" : "font-semibold text-success"}>
              {atSlotCapacity ? "FULL" : "AVAILABLE"}
            </span>
          </div>
          {activeInSelectedLga.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm">
              {activeInSelectedLga.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-light px-3 py-2"
                >
                  <span className="font-medium text-ink">{row.business?.business_name}</span>
                  <span className="text-xs text-chat-meta">
                    {row.tier_label} · {formatCompactCount(row.views_count ?? 0)} views · {row.enquiries_count ?? 0}{" "}
                    enquiries
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <VendorBoostCampaignsTable
        rows={campaigns}
        loading={campaignsLoading}
        title="Active Boost Campaigns (all vendors)"
        showVendorColumn
        showPerformanceMetrics
        showDetailsAction
        groupExtensions
        emptyMessage="No vendor boost campaigns yet."
      />

      <BoostWaitingList />
    </div>
  );
}
