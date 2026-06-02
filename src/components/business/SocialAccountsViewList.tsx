import { ExternalLink } from "lucide-react";

import { SocialPlatformIcon } from "@/components/business/SocialPlatformIcon";
import {
  normalizeSocialUrl,
  socialPlatformLabel,
  type SocialAccount,
} from "@/features/business/socialAccounts";
import { cn } from "@/lib/utils";

type SocialAccountsViewListProps = {
  accounts: SocialAccount[];
  className?: string;
};

export function SocialAccountsViewList({ accounts, className }: SocialAccountsViewListProps) {
  const visible = accounts
    .map((account) => ({
      ...account,
      url: normalizeSocialUrl(account.url),
    }))
    .filter((account) => account.url);

  if (visible.length === 0) {
    return (
      <p className="text-sm italic text-muted-foreground">
        No social accounts added yet. Edit your profile to add links visitors can tap on your business page.
      </p>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <ul className="space-y-3">
        {visible.map((account) => (
          <li
            key={`${account.platform}-${account.url}`}
            className="flex flex-col gap-3 rounded-xl border border-border-light bg-secondary/40 p-4 sm:flex-row sm:items-center"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border-light bg-white shadow-sm">
                <SocialPlatformIcon platform={account.platform} variant="brand" className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {socialPlatformLabel(account.platform)}
                </p>
                <a
                  href={account.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-sm font-medium text-brand hover:underline"
                >
                  <span className="truncate">{account.url}</span>
                  <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
