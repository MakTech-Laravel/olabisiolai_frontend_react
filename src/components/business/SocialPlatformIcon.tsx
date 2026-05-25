import {
  SOCIAL_BRAND_COLORS,
  SOCIAL_BRAND_ICON_DEFS,
} from "@/components/business/socialBrandAssets";
import type { SocialPlatform } from "@/features/business/socialAccounts";
import { cn } from "@/lib/utils";

type SocialPlatformIconProps = {
  platform: SocialPlatform;
  className?: string;
  /** `brand` = official logo colors; `mono` = inherits current text color. */
  variant?: "brand" | "mono";
};

export function SocialPlatformIcon({
  platform,
  className,
  variant = "brand",
}: SocialPlatformIconProps) {
  const def = SOCIAL_BRAND_ICON_DEFS[platform];
  if (!def) return null;

  const shared = cn("size-5 shrink-0", className);
  const fill = variant === "brand" ? SOCIAL_BRAND_COLORS[platform] : "currentColor";
  const viewBox = def.viewBox ?? "0 0 24 24";
  const gradientId = `instagram-gradient-${platform}`;

  if (variant === "brand" && def.useGradient && platform === "instagram") {
    return (
      <svg className={shared} viewBox={viewBox} aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F58529" />
            <stop offset="25%" stopColor="#FEDA77" />
            <stop offset="50%" stopColor="#DD2A7B" />
            <stop offset="75%" stopColor="#8134AF" />
            <stop offset="100%" stopColor="#515BD4" />
          </linearGradient>
        </defs>
        {def.paths.map((d) => (
          <path key={d.slice(0, 12)} d={d} fill={`url(#${gradientId})`} />
        ))}
      </svg>
    );
  }

  if (platform === "snapchat" && variant === "brand") {
    return (
      <svg className={shared} viewBox={viewBox} aria-hidden>
        {def.paths.map((d) => (
          <path
            key={d.slice(0, 12)}
            d={d}
            fill={SOCIAL_BRAND_COLORS.snapchat}
            stroke="#1a1a1a"
            strokeWidth="0.35"
          />
        ))}
      </svg>
    );
  }

  return (
    <svg className={shared} viewBox={viewBox} fill={fill} aria-hidden>
      {def.paths.map((d) => (
        <path key={d.slice(0, 12)} d={d} />
      ))}
    </svg>
  );
}
