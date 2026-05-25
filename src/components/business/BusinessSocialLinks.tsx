import { SocialPlatformIcon } from "@/components/business/SocialPlatformIcon";
import {
  normalizeSocialUrl,
  socialPlatformLabel,
  type SocialAccount,
} from "@/features/business/socialAccounts";
import { cn } from "@/lib/utils";

type BusinessSocialLinksProps = {
  accounts: SocialAccount[];
  className?: string;
  iconClassName?: string;
  title?: string;
};

export function BusinessSocialLinks({
  accounts,
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

  if (visible.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <div className="flex flex-wrap items-center gap-3">
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
