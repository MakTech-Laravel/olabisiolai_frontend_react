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

function stripHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "").replace(/^\/+/, "").replace(/\/+$/, "");
}

function profileUrlForHandle(platform: SocialPlatform, handle: string): string {
  switch (platform) {
    case "instagram":
      return `https://instagram.com/${handle}`;
    case "facebook":
      return `https://facebook.com/${handle}`;
    case "x":
      return `https://x.com/${handle}`;
    case "linkedin":
      return `https://linkedin.com/in/${handle}`;
    case "tiktok":
      return `https://tiktok.com/@${handle}`;
    case "youtube":
      return `https://youtube.com/@${handle}`;
    case "pinterest":
      return `https://pinterest.com/${handle}`;
    case "threads":
      return `https://threads.net/@${handle}`;
    case "snapchat":
      return `https://snapchat.com/add/${handle}`;
    default:
      return `https://${handle}`;
  }
}

/** Normalize a social input to a full profile URL (supports @handle and bare handles). */
export function normalizeSocialInput(platform: SocialPlatform, raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const withoutScheme = trimmed.replace(/^https?:\/\//i, "");
  if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(withoutScheme) && !withoutScheme.startsWith("@")) {
    return `https://${withoutScheme.replace(/^\/+/, "")}`;
  }

  const handle = stripHandle(trimmed);
  if (!handle || handle.includes(" ")) return "";

  return profileUrlForHandle(platform, handle);
}

/** @deprecated Prefer normalizeSocialInput with platform. */
export function normalizeSocialUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

export function normalizeSocialAccount(account: SocialAccount): SocialAccount {
  return {
    platform: account.platform,
    url: normalizeSocialInput(account.platform, account.url),
  };
}

export function parseSocialAccounts(value: unknown): SocialAccount[] {
  if (!Array.isArray(value)) return [];

  const accounts: SocialAccount[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const platform = String(row.platform ?? "").trim().toLowerCase();
    const rawUrl = String(row.url ?? "").trim();
    if (!isSocialPlatform(platform) || !rawUrl) continue;
    const url = normalizeSocialInput(platform, rawUrl);
    if (!url) continue;
    accounts.push({ platform, url });
  }

  return accounts;
}

export function appendSocialAccountsToFormData(
  formData: FormData,
  accounts: SocialAccount[],
): void {
  accounts
    .map((account) => normalizeSocialAccount(account))
    .filter((account) => account.url)
    .forEach((account, index) => {
      formData.append(`social_accounts[${index}][platform]`, account.platform);
      formData.append(`social_accounts[${index}][url]`, account.url);
    });
}

export function validateSocialAccounts(accounts: SocialAccount[]): string | null {
  for (const account of accounts) {
    if (!account.platform) return "Select a platform for each social account.";
    const url = normalizeSocialInput(account.platform, account.url);
    if (!url) return "Enter a handle (e.g. @gidira) or profile link for each social account.";
    try {
      const parsed = new URL(url);
      if (!parsed.hostname) return "Enter a valid social profile link or handle.";
    } catch {
      return "Enter a valid social profile link or handle.";
    }
  }
  if (accounts.length > 10) return "You can add up to 10 social accounts.";
  return null;
}

export function emptySocialAccount(): SocialAccount {
  return { platform: "instagram", url: "" };
}
