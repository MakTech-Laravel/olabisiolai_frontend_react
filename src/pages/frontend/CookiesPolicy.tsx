import type { ReactNode } from "react";

import { container } from "@/lib/container";
import { cn } from "@/lib/utils";

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold leading-7 text-ink-heading">{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="ml-5 flex list-disc flex-col gap-1 text-sm leading-6 text-body-secondary">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function CookiesPolicy() {
  return (
    <div className="w-full bg-muted">
      <div className={cn(container, "flex flex-col gap-5 py-10 sm:py-14")}>
        <header className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold leading-10 text-ink-heading">Cookies Policy</h1>
          <p className="text-sm text-body-secondary">Last updated: March 29, 2026</p>
        </header>

        <article className="flex w-full flex-col gap-7 rounded-2xl border border-border-gray bg-card p-6 shadow-sm sm:p-8">
          <Section title="1. What Are Cookies?">
            <p className="text-sm leading-6 text-body-secondary">
              Cookies are small text files stored on your device. They help us remember your
              preferences, improve your experience, and understand how you use our platform.
            </p>
          </Section>

          <Section title="2. How We Use Cookies">
            <BulletList
              items={[
                "Essential cookies: required for core platform functionality.",
                "Authentication cookies: keep you signed in securely.",
                "Preference cookies: remember your settings and choices.",
                "Analytics cookies: help us understand usage behavior.",
                "Marketing cookies: deliver relevant promotional messages with consent.",
              ]}
            />
          </Section>

          <Section title="3. Types of Cookies We Use">
            <p className="text-sm font-semibold text-ink-heading">Essential Cookies</p>
            <p className="text-sm leading-6 text-body-secondary">
              Required for navigation, account access, and secure session management.
            </p>

            <p className="text-sm font-semibold text-ink-heading">Functional Cookies</p>
            <p className="text-sm leading-6 text-body-secondary">
              Improve usability by remembering language, region, and interface preferences.
            </p>

            <p className="text-sm font-semibold text-ink-heading">Analytics Cookies</p>
            <p className="text-sm leading-6 text-body-secondary">
              Help us monitor performance and improve user experience across the platform.
            </p>

            <p className="text-sm font-semibold text-ink-heading">Marketing Cookies</p>
            <p className="text-sm leading-6 text-body-secondary">
              Used to deliver relevant promotions, offers, and campaign measurement.
            </p>
          </Section>

          <Section title="4. Third-Party Cookies">
            <BulletList
              items={[
                "Google Analytics for traffic measurement and behavior insights.",
                "Paystack for secure payment processing signals.",
                "Social media integrations for sharing and engagement features.",
                "Advertising partners for campaign attribution where applicable.",
              ]}
            />
          </Section>

          <Section title="5. Session vs. Persistent Cookies">
            <p className="text-sm font-semibold text-ink-heading">Session Cookies</p>
            <p className="text-sm leading-6 text-body-secondary">
              Temporary cookies that expire when your browser session ends.
            </p>
            <p className="text-sm font-semibold text-ink-heading">Persistent Cookies</p>
            <p className="text-sm leading-6 text-body-secondary">
              Remain on your device for a set period to remember preferences and settings.
            </p>
          </Section>

          <Section title="6. Managing Your Cookie Preferences">
            <BulletList
              items={[
                "Browser settings: block or clear cookies directly in your browser.",
                "Cookie banner preferences: accept or reject non-essential cookies.",
                "Opt-out tools from analytics and ad providers where available.",
                "Do Not Track support depending on browser and provider behavior.",
              ]}
            />
          </Section>

          <Section title="7. Browser-Specific Instructions">
            <BulletList
              items={[
                "Google Chrome: Settings > Privacy and Security > Cookies.",
                "Safari: Preferences > Privacy > Manage Website Data.",
                "Firefox: Options > Privacy & Security > Cookies and Site Data.",
                "Microsoft Edge: Settings > Privacy > Cookies.",
              ]}
            />
          </Section>

          <Section title="8. Mobile Device Cookies">
            <p className="text-sm leading-6 text-body-secondary">
              Mobile browsers and apps handle cookies differently. Review your mobile browser and
              OS privacy settings for specific controls.
            </p>
          </Section>

          <Section title="9. Updates to This Policy">
            <p className="text-sm leading-6 text-body-secondary">
              We may update this policy to reflect legal, technical, or operational changes.
              Significant updates will be communicated on the platform.
            </p>
          </Section>

          <Section title="10. Contact Us">
            <div className="text-sm leading-6 text-body-secondary">
              <p>Email: privacy@gidira.ng</p>
              <p>Phone: +234 803 123 4567</p>
            </div>
          </Section>
        </article>
      </div>
    </div>
  );
}
