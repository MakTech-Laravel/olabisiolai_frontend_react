import { useState } from "react";
import { Building, Building2, Shield, User } from "lucide-react";

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${on ? "bg-chat-accent" : "bg-slate-300"
        }`}
    >
      <span
        className={`inline-block size-[18px] rounded-full bg-white shadow transition-transform duration-200 ${on ? "translate-x-[22px]" : "translate-x-[3px]"
          }`}
      />
    </button>
  );
}

const DOCS = [
  "Valid ID (Driver's License, Passport, etc.)",
  "CAC Registration Document",
  "Proof of Address (Utility Bill, etc.)",
];

export default function PlatformSettings() {
  const [requiredDocs, setRequiredDocs] = useState([true, true, true]);
  const [security, setSecurity] = useState({
    mandatory2FA: true,
    sessionTimeout: false,
  });
  const [notificationChannels, setNotificationChannels] = useState({
    systemWide: true,
    emailDigest: true,
    securityPings: true,
    smsAlerts: false,
  });
  const [ipWhitelist, setIpWhitelist] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  return (
    <div className="bg-slate-50 p-4">
      <div className="mx-auto max-w-9xl space-y-4">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold leading-tight text-ink-heading sm:text-3xl">Settings</h1>
        </div>

        <section className="rounded-2xl border border-chat-border-subtle bg-card p-5">
          <div className="mb-4 flex items-center gap-3 border-b border-border-gray pb-4">
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Shield className="size-4" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-ink">Verification Settings</h2>
              <p className="text-sm text-chat-meta">Required documents and fees for user verification</p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-chat-meta">Required Documents</p>
            <div className="space-y-2">
              {DOCS.map((doc, idx) => (
                <button
                  key={doc}
                  type="button"
                  onClick={() =>
                    setRequiredDocs((prev) => prev.map((item, i) => (i === idx ? !item : item)))
                  }
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm ${requiredDocs[idx]
                    ? "border-violet-200 bg-violet-50/40 text-ink"
                    : "border-border-gray bg-background text-body-secondary"
                    }`}
                >
                  <span
                    className={`inline-flex size-5 items-center justify-center rounded-md border text-xs ${requiredDocs[idx]
                      ? "border-violet-500 bg-violet-500 text-white"
                      : "border-border-gray bg-card text-transparent"
                      }`}
                  >
                    ✓
                  </span>
                  {doc}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 border-t border-border-gray pt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-chat-meta">
              Verification Packages (3 Types)
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {[
                {
                  key: "individual",
                  icon: User,
                  label: "Individual",
                  desc: "Best for solo entrepreneurs and independent contractors. Requires government ID and personal selfie verification.",
                  badge: "Trusted Badge",
                  price: "2,500",
                  highlight: true,
                },
                {
                  key: "businessName",
                  icon: Building2,
                  label: "Business Name",
                  desc: "For registered sole proprietorships. Includes CAC document validation and business account linking.",
                  badge: "Vendor Priority",
                  price: "5,000",
                },
                {
                  key: "limitedCompany",
                  icon: Building,
                  label: "Limited Company (LTD)",
                  desc: "The gold standard for corporate entities. Comprehensive verification of directors, shareholders, and legal status.",
                  badge: "Enterprise Blue Badge",
                  price: "10,000",
                },
              ].map((item) => (
                <article
                  key={item.key}
                  className={`rounded-xl border p-3 ${item.highlight ? "border-red-300 bg-[#eff4ff] shadow-[0_0_0_1px_rgba(239,68,68,0.18)]" : "border-chat-border-subtle bg-[#f7f9ff]"}`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="inline-flex size-6 items-center justify-center rounded-md bg-rose-50 text-rose-500">
                      <item.icon className="size-3.5" />
                    </span>
                    <p className="text-sm font-semibold text-ink">₦{item.price}</p>
                  </div>
                  <p className="text-sm font-semibold text-ink">{item.label}</p>
                  <p className="mt-1 min-h-14 text-[11px] leading-4 text-chat-meta">{item.desc}</p>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-body-secondary">● {item.badge}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-chat-border-subtle bg-card p-5">
          <h2 className="mb-3 text-xl font-semibold text-ink">Security & Access Control</h2>
          <div className="space-y-3 border-b border-border-gray pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">Mandatory 2FA</p>
                <p className="text-xs text-chat-meta">Enforce two-factor for all admin staff</p>
              </div>
              <Toggle
                on={security.mandatory2FA}
                onToggle={() =>
                  setSecurity((prev) => ({ ...prev, mandatory2FA: !prev.mandatory2FA }))
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">Session Timeout</p>
                <p className="text-xs text-chat-meta">Auto logout after 30 min inactivity</p>
              </div>
              <Toggle
                on={security.sessionTimeout}
                onToggle={() =>
                  setSecurity((prev) => ({ ...prev, sessionTimeout: !prev.sessionTimeout }))
                }
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-chat-meta">IP Whitelisting</p>
              <input
                value={ipWhitelist}
                onChange={(event) => setIpWhitelist(event.target.value)}
                placeholder="Enter IP addresses..."
                className="h-10 w-full rounded-lg border border-border-gray bg-background px-3 text-sm text-ink outline-none focus:border-chat-accent"
              />
            </div>
          </div>

          <div className="pt-4">
            <h3 className="mb-2 text-sm font-semibold text-ink">Notification Channels</h3>
            <div className="space-y-3">
              {[
                {
                  key: "systemWide",
                  label: "System-wide Alerts",
                  desc: "Critical system notifications",
                },
                { key: "emailDigest", label: "Email Daily Digest", desc: "Daily summary reports" },
                { key: "securityPings", label: "Critical Security Pings", desc: "Immediate security alerts" },
                { key: "smsAlerts", label: "SMS Alerts", desc: "Critical SMS notifications" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">{item.label}</p>
                    <p className="text-xs text-chat-meta">{item.desc}</p>
                  </div>
                  <Toggle
                    on={notificationChannels[item.key as keyof typeof notificationChannels]}
                    onToggle={() =>
                      setNotificationChannels((prev) => ({
                        ...prev,
                        [item.key]: !prev[item.key as keyof typeof prev],
                      }))
                    }
                  />
                </div>
              ))}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-chat-meta">Webhook URL</p>
                <input
                  value={webhookUrl}
                  onChange={(event) => setWebhookUrl(event.target.value)}
                  placeholder="https://..."
                  className="h-10 w-full rounded-lg border border-border-gray bg-background px-3 text-sm text-ink outline-none focus:border-chat-accent"
                />
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}