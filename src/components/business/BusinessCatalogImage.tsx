import * as React from "react";

import { BUSINESS_GALLERY_ASPECT_CLASS } from "@/lib/businessImageLayout";
import { cn } from "@/lib/utils";

type BusinessCatalogImageProps = {
  src: string;
  alt?: string;
  className?: string;
  imageClassName?: string;
  aspectClassName?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
  priority?: boolean;
  interactive?: boolean;
};

export function BusinessCatalogImage({
  src,
  alt = "",
  className,
  imageClassName,
  aspectClassName = BUSINESS_GALLERY_ASPECT_CLASS,
  onClick,
  priority = false,
  interactive = Boolean(onClick),
}: BusinessCatalogImageProps) {
  const [loaded, setLoaded] = React.useState(false);

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "relative block w-full overflow-hidden bg-[#f3f4f6]",
        aspectClassName,
        interactive && "cursor-zoom-in transition-transform hover:scale-[1.01] active:scale-[0.99]",
        className,
      )}
    >
      {!loaded ? (
        <div className="absolute inset-0 animate-pulse bg-border-light" aria-hidden />
      ) : null}
      <img
        src={src}
        alt={alt}
        className={cn(
          "absolute inset-0 m-auto block max-h-full max-w-full object-contain",
          imageClassName,
        )}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
      />
    </Wrapper>
  );
}
