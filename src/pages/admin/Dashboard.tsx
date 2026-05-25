import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CheckCircle2,
  MousePointerClick,
  TrendingUp,
  Store,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { formatCompactCount } from "@/features/boost/boostCampaignTypes";
import {
  fetchAdminDashboard,
  type AdminDashboardQuickAction,
  type AdminDashboardRange,
  type AdminDashboardSeriesPoint,
} from "@/features/dashboard/adminDashboardApi";

type StatCard = {
  label: string;
  value: string;
  icon: LucideIcon;
  tint: string;
};

function formatStatValue(value: number, compact = false): string {
  if (compact) return formatCompactCount(value);
  return value.toLocaleString();
}

function buildLinePoints(series: AdminDashboardSeriesPoint[], width: number, height: number): string {
  if (series.length === 0) return "";

  const values = series.map((point) => point.value);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = Math.max(maxValue - minValue, 1);
  const spacing = series.length > 1 ? width / (series.length - 1) : 0;

  return series
    .map((point, index) => {
      const x = index * spacing;
      const y = height - ((point.value - minValue) / range) * (height - 20) - 10;
      return `${x},${y}`;
    })
    .join(" ");
}

export default function Dashboard() {
  const [range, setRange] = useState<AdminDashboardRange>("monthly");

  const dashboardQuery = useQuery({
    queryKey: ["admin", "dashboard", range],
    queryFn: () => fetchAdminDashboard(range),
  });

  const loading = dashboardQuery.isPending;
  const stats = dashboardQuery.data?.stats;
  const leadsSeries = dashboardQuery.data?.leads_over_time ?? [];
  const businessesSeries = dashboardQuery.data?.new_businesses ?? [];
  const quickActions = dashboardQuery.data?.quick_actions ?? [];

  const statCards: StatCard[] = useMemo(
    () => [
      {
        label: "Total Businesses",
        value: loading ? "…" : formatStatValue(stats?.total_businesses ?? 0),
        icon: Store,
        tint: "bg-surface-soft text-chat-accent",
      },
      {
        label: "Total Verified Businesses",
        value: loading ? "…" : formatStatValue(stats?.verified_businesses ?? 0),
        icon: CheckCircle2,
        tint: "bg-success/10 text-success",
      },
      {
        label: "Pending Verifications",
        value: loading ? "…" : formatStatValue(stats?.pending_verifications ?? 0),
        icon: TrendingUp,
        tint: "bg-amber-100 text-amber-500",
      },
      {
        label: "Daily Active Users",
        value: loading ? "…" : formatStatValue(stats?.daily_active_users ?? 0, true),
        icon: Activity,
        tint: "bg-surface-soft text-chat-accent",
      },
      {
        label: "Total Lead Clicks",
        value: loading ? "…" : formatStatValue(stats?.total_lead_clicks ?? 0),
        icon: MousePointerClick,
        tint: "bg-tint-red text-brand-red",
      },
    ],
    [loading, stats],
  );

  const chartWidth = 500;
  const chartHeight = 180;
  const linePoints = buildLinePoints(leadsSeries, chartWidth, chartHeight);
  const barMaxValue = Math.max(...businessesSeries.map((point) => point.value), 1);
  const barAreaHeight = chartHeight - 24;

  return (
    <>
      <DashboardHeader range={range} onRangeChange={setRange} />

      {dashboardQuery.isError ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {dashboardQuery.error instanceof Error
            ? dashboardQuery.error.message
            : "Could not load dashboard data."}
        </p>
      ) : null}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {statCards.map((item) => (
          <article key={item.label} className="rounded-xl border border-chat-border-subtle bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-chat-meta">{item.label}</p>
                <p
                  className={`mt-1 text-4xl font-semibold leading-10 text-ink ${loading ? "text-chat-meta" : ""
                    }`}
                >
                  {item.value}
                </p>
              </div>
              <span className={`rounded-lg p-2 ${item.tint}`}>
                <item.icon className="size-4" />
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="rounded-xl border border-chat-border-subtle bg-card p-4">
          <h2 className="text-sm font-semibold text-ink">Leads Over Time</h2>
          <div
            className={`mt-4 h-56 rounded-lg border border-chat-border-subtle bg-background p-3 ${loading ? "animate-pulse" : ""
              }`}
          >
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-full w-full">
              {linePoints ? (
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-success"
                  points={linePoints}
                />
              ) : null}
              {leadsSeries.map((point, index) => {
                const x =
                  leadsSeries.length > 1
                    ? (index / Math.max(leadsSeries.length - 1, 1)) * chartWidth
                    : 0;
                return (
                  <line
                    key={point.label}
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={chartHeight}
                    className="text-chat-border-subtle"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                );
              })}
            </svg>
          </div>
        </article>

        <article className="rounded-xl border border-chat-border-subtle bg-card p-4">
          <h2 className="text-sm font-semibold text-ink">New Businesses</h2>
          <div
            className={`mt-4 flex h-56 items-end gap-2 rounded-lg border border-chat-border-subtle bg-background p-3 sm:gap-3 ${loading ? "animate-pulse" : ""
              }`}
          >
            {businessesSeries.map((point) => {
              const height = Math.max(8, Math.round((point.value / barMaxValue) * barAreaHeight));
              return (
                <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-chat-accent"
                    style={{ height: `${height}px` }}
                  />
                  <span className="truncate text-[10px] text-chat-meta">{point.label}</span>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="mt-6 rounded-xl border border-chat-border-subtle bg-card p-4">
        <h2 className="text-2xl font-semibold text-ink">Quick Actions</h2>
        <QuickActionsList loading={loading} quickActions={quickActions} />
      </section>
    </>
  );
}

function DashboardHeader({
  range,
  onRangeChange,
}: {
  range: AdminDashboardRange;
  onRangeChange: (range: AdminDashboardRange) => void;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <DashboardTitle />
      <RangeToggle range={range} onRangeChange={onRangeChange} />
    </div>
  );
}

function DashboardTitle() {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-chat-accent">
        Operational Overview
      </p>
      <h1 className="text-2xl font-semibold leading-tight text-ink-heading sm:text-3xl lg:text-4xl">
        Marketplace Intelligence
      </h1>
    </div>
  );
}

function RangeToggle({
  range,
  onRangeChange,
}: {
  range: AdminDashboardRange;
  onRangeChange: (range: AdminDashboardRange) => void;
}) {
  return (
    <div className="inline-flex shrink-0 self-start overflow-hidden rounded-lg border border-chat-border-subtle bg-card">
      <button
        type="button"
        onClick={() => onRangeChange("weekly")}
        className={`px-3 py-1.5 text-xs sm:py-1 ${range === "weekly" ? "bg-chat-accent text-ice" : "text-chat-meta"
          }`}
      >
        Weekly
      </button>
      <button
        type="button"
        onClick={() => onRangeChange("monthly")}
        className={`px-3 py-1.5 text-xs sm:py-1 ${range === "monthly" ? "bg-chat-accent text-ice" : "text-chat-meta"
          }`}
      >
        Monthly
      </button>
    </div>
  );
}

function QuickActionsList({
  loading,
  quickActions,
}: {
  loading: boolean;
  quickActions: AdminDashboardQuickAction[];
}) {
  return (
    <div className="mt-3 space-y-3">
      {loading
        ? [0, 1, 2].map((key) => (
          <div
            key={key}
            className="flex animate-pulse items-center justify-between rounded-lg bg-background px-4 py-3"
          >
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-48" />
              <SkeletonBlock className="h-3 w-36" />
            </div>
            <SkeletonBlock className="h-7 w-16 rounded-full" />
          </div>
        ))
        : quickActions.map((item) => (
          <QuickActionRow key={item.title} item={item} />
        ))}
    </div>
  );
}

function QuickActionRow({ item }: { item: AdminDashboardQuickAction }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-background px-4 py-3">
      <div>
        <p className="text-sm font-medium text-ink">{item.title}</p>
        <p className="text-xs text-chat-meta">{item.description}</p>
      </div>
      <Link
        to={item.href}
        className="shrink-0 rounded-full bg-brand-red px-3 py-1 text-xs font-medium text-ice"
      >
        {item.action}
      </Link>
    </div>
  );
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`rounded bg-chat-border-subtle/60 ${className}`} />;
}
