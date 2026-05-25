export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "x"
  | "linkedin"
  | "tiktok"
  | "youtube"
  | "pinterest"
  | "threads"
  | "snapchat";

export type SocialAccount = {
  platform: SocialPlatform;
  url: string;
};

export const SOCIAL_PLATFORM_OPTIONS: { value: SocialPlatform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "x", label: "X (Twitter)" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "pinterest", label: "Pinterest" },
  { value: "threads", label: "Threads" },
  { value: "snapchat", label: "Snapchat" },
];

const PLATFORM_SET = new Set(SOCIAL_PLATFORM_OPTIONS.map((p) => p.value));

export function isSocialPlatform(value: string): value is SocialPlatform {
  return PLATFORM_SET.has(value as SocialPlatform);
}

export function socialPlatformLabel(platform: SocialPlatform): string {
  return SOCIAL_PLATFORM_OPTIONS.find((p) => p.value === platform)?.label ?? platform;
}

export function normalizeSocialUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

export function parseSocialAccounts(value: unknown): SocialAccount[] {
  if (!Array.isArray(value)) return [];

  const accounts: SocialAccount[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const platform = String(row.platform ?? "").trim().toLowerCase();
    const url = normalizeSocialUrl(String(row.url ?? ""));
    if (!isSocialPlatform(platform) || !url) continue;
    accounts.push({ platform, url });
  }

  return accounts;
}

export function appendSocialAccountsToFormData(
  formData: FormData,
  accounts: SocialAccount[],
): void {
  accounts
    .map((account) => ({
      platform: account.platform,
      url: normalizeSocialUrl(account.url),
    }))
    .filter((account) => account.url)
    .forEach((account, index) => {
      formData.append(`social_accounts[${index}][platform]`, account.platform);
      formData.append(`social_accounts[${index}][url]`, account.url);
    });
}

export function validateSocialAccounts(accounts: SocialAccount[]): string | null {
  for (const account of accounts) {
    if (!account.platform) return "Select a platform for each social account.";
    const url = normalizeSocialUrl(account.url);
    if (!url) return "Enter a profile link for each social account.";
    try {
      const parsed = new URL(url);
      if (!parsed.hostname) return "Enter a valid social profile URL.";
    } catch {
      return "Enter a valid social profile URL.";
    }
  }
  if (accounts.length > 10) return "You can add up to 10 social accounts.";
  return null;
}

export function emptySocialAccount(): SocialAccount {
  return { platform: "instagram", url: "" };
}
