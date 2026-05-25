import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const DEFAULT_HEADER_AVATAR = "/images/avatar/default-header-avatar.png";

type HeaderAvatarProps = {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackSrc?: string;
};

export function HeaderAvatar({
  src,
  alt,
  className,
  fallbackSrc = DEFAULT_HEADER_AVATAR,
}: HeaderAvatarProps) {
  const [avatarSrc, setAvatarSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    setAvatarSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <img
      src={avatarSrc}
      alt={alt}
      className={cn("h-full w-full object-cover", className)}
      decoding="async"
      loading="eager"
      onError={() => setAvatarSrc(fallbackSrc)}
    />
  );
}
