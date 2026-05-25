import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

type NotificationKind = "system" | "user" | "broadcast";
type AlertTone = "red" | "blue" | "green" | "amber";

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  timeAgo: string;
  kind: NotificationKind;
  tone: AlertTone;
  actionLabel: string;
};

const ITEMS: NotificationItem[] = [
  {
    id: 1,
    title: "Verification Queue Overflow",
    message: "18 pending applications exceed 48-hour SLA.",
    timeAgo: "12 min ago",
    kind: "system",
    tone: "red",
    actionLabel: "Review Queue",
  },
  {
    id: 2,
    title: "New Business Registration",
    message: "TechVista Solutions submitted verification docs.",
    timeAgo: "45 min ago",
    kind: "user",
    tone: "blue",
    actionLabel: "View Application",
  },
  {
    id: 3,
    title: "Payment Processed",
    message: "₦350,000 subscription from Kano Motors Ltd.",
    timeAgo: "2 hours ago",
    kind: "system",
    tone: "green",
    actionLabel: "View Receipt",
  },
  {
    id: 4,
    title: "Boost Expiring Soon",
    message: "3 Gold tier boosts expiring in 48 hours.",
    timeAgo: "3 hours ago",
    kind: "broadcast",
    tone: "amber",
    actionLabel: "View Boosts",
  },
  {
    id: 5,
    title: "System Maintenance",
    message: "Scheduled: Apr 5, 2026, 02:00-04:00 WAT.",
    timeAgo: "5 hours ago",
    kind: "system",
    tone: "blue",
    actionLabel: "View Details",
  },
  {
    id: 6,
    title: "Monthly Report Ready",
    message: "March 2026 analytics report available.",
    timeAgo: "1 day ago",
    kind: "broadcast",
    tone: "green",
    actionLabel: "Download",
  },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${on ? "bg-green-500" : "bg-slate-200"
        }`}
    >
      <span
        className={`inline-block size-[18px] rounded-full bg-white shadow transition-transform duration-200 ${on ? "translate-x-[22px]" : "translate-x-[3px]"
          }`}
      />
    </button>
  );
}

export default function NotificationSettings() {
  const [activeTab, setActiveTab] = useState<"all" | NotificationKind>("all");
  const [settings, setSettings] = useState({
    emailAlerts: true,
    smsAlerts: false,
    pushNotifications: true,
    dailyDigest: false,
  });

  const filteredItems = useMemo(() => {
    if (activeTab === "all") return ITEMS;
    return ITEMS.filter((item) => item.kind === activeTab);
  }, [activeTab]);

  const toneClass = (tone: AlertTone) => {
    if (tone === "red") return "bg-brand-red";
    if (tone === "blue") return "bg-chat-accent";
    if (tone === "green") return "bg-success";
    return "bg-amber-500";
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold leading-tight text-ink-heading sm:text-3xl">Notifications</h1>
      </div>

      <section className="rounded-2xl border border-chat-border-subtle bg-card p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-chat-accent">Communication Hub</p>
            <h2 className="text-2xl font-semibold text-ink">Notification Center</h2>
            <p className="text-sm text-chat-meta">Manage alerts, broadcasts, and system notifications</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-chat-accent px-3 py-2 text-xs font-semibold text-white hover:bg-chat-accent/90"
          >
            <Plus className="size-4" />
            Create Broadcast
          </button>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-chat-border-subtle bg-background p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-chat-meta">Unread Alerts</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-4xl font-semibold leading-10 text-ink">24</p>
              <span className="rounded-full bg-tint-red px-2 py-0.5 text-[10px] font-semibold uppercase text-brand-red">
                Urgent
              </span>
            </div>
          </article>
          <article className="rounded-xl border border-chat-border-subtle bg-background p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-chat-meta">Sent Today</p>
            <p className="mt-1 text-4xl font-semibold leading-10 text-ink">1,842</p>
          </article>
          <article className="rounded-xl border border-chat-border-subtle bg-background p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-chat-meta">Delivery Rate</p>
            <p className="mt-1 text-4xl font-semibold leading-10 text-ink">98.4%</p>
          </article>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          {([
            ["all", "All"],
            ["system", "System Alerts"],
            ["user", "User Notifications"],
            ["broadcast", "Broadcasts"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${activeTab === key ? "bg-chat-accent text-white" : "bg-background text-body-secondary hover:bg-muted"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filteredItems.map((item) => (
            <article key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-chat-border-subtle bg-background p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${toneClass(item.tone)}`} />
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                </div>
                <p className="mt-1 text-xs text-body-secondary">{item.message}</p>
                <p className="text-xs text-chat-meta">{item.timeAgo}</p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-md border border-border-gray px-2.5 py-1 text-[11px] font-semibold text-body-secondary hover:bg-muted"
              >
                {item.actionLabel}
              </button>
            </article>
          ))}
        </div>

        <section className="mt-4 rounded-xl border border-chat-border-subtle bg-background p-4">
          <h3 className="text-sm font-semibold text-ink">Notification Settings</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border border-chat-border-subtle bg-card px-3 py-2">
              <div>
                <p className="text-sm font-medium text-ink">Email Alerts</p>
                <p className="text-xs text-chat-meta">Receive email notifications</p>
              </div>
              <Toggle
                on={settings.emailAlerts}
                onToggle={() => setSettings((prev) => ({ ...prev, emailAlerts: !prev.emailAlerts }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-chat-border-subtle bg-card px-3 py-2">
              <div>
                <p className="text-sm font-medium text-ink">SMS Alerts</p>
                <p className="text-xs text-chat-meta">Receive SMS notifications</p>
              </div>
              <Toggle
                on={settings.smsAlerts}
                onToggle={() => setSettings((prev) => ({ ...prev, smsAlerts: !prev.smsAlerts }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-chat-border-subtle bg-card px-3 py-2">
              <div>
                <p className="text-sm font-medium text-ink">Push Notifications</p>
                <p className="text-xs text-chat-meta">Receive browser push alerts</p>
              </div>
              <Toggle
                on={settings.pushNotifications}
                onToggle={() => setSettings((prev) => ({ ...prev, pushNotifications: !prev.pushNotifications }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-chat-border-subtle bg-card px-3 py-2">
              <div>
                <p className="text-sm font-medium text-ink">Daily Digest</p>
                <p className="text-xs text-chat-meta">Receive daily summary email</p>
              </div>
              <Toggle
                on={settings.dailyDigest}
                onToggle={() => setSettings((prev) => ({ ...prev, dailyDigest: !prev.dailyDigest }))}
              />
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}