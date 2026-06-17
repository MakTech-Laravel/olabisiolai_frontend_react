import { Globe } from "lucide-react";

import { SocialPlatformIcon } from "@/components/business/SocialPlatformIcon";
import {
  normalizeSocialUrl,
  socialPlatformLabel,
  type SocialAccount,
} from "@/features/business/socialAccounts";
import { cn } from "@/lib/utils";

type BusinessSocialLinksProps = {
  accounts: SocialAccount[];
  website?: string | null;
  className?: string;
  iconClassName?: string;
  title?: string;
};

export function BusinessSocialLinks({
  accounts,
  website,
  className,
  iconClassName,
  title = "Follow us",
}: BusinessSocialLinksProps) {
  const visible = accounts
    .map((account) => ({
      ...account,
      url: normalizeSocialUrl(account.url),
    }))
    .filter((account) => account.url);
  const websiteUrl = website?.trim() ? normalizeSocialUrl(website.trim()) : "";

  if (visible.length === 0 && !websiteUrl) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {title ? <p className="text-sm font-semibold text-ink">{title}</p> : null}
      <div className="flex flex-wrap items-center gap-3">
        {websiteUrl ? (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex size-11 items-center justify-center rounded-full border border-border-light bg-white shadow-sm transition-transform hover:scale-105",
              iconClassName,
            )}
            aria-label="Website"
            title="Website"
          >
            <Globe className="size-6 text-chat-accent" aria-hidden />
          </a>
        ) : null}
        {visible.map((account) => (
          <a
            key={`${account.platform}-${account.url}`}
            href={account.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex size-11 items-center justify-center rounded-full border border-border-light bg-white shadow-sm transition-transform hover:scale-105",
              iconClassName,
            )}
            aria-label={`${socialPlatformLabel(account.platform)} profile`}
            title={socialPlatformLabel(account.platform)}
          >
            <SocialPlatformIcon platform={account.platform} variant="brand" className="size-6" />
          </a>
        ))}
      </div>
    </div>
  );
}
