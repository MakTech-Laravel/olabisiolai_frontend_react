import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { VendorDashboardCardProps } from "../dashboardTypes";

import fallbackImg from "@/assets/protfolio_image/Property Image 1.png";

export function DashboardPortfolioCard({ dashboard }: VendorDashboardCardProps) {
  const images = dashboard.business.coverPhotoUrls.length
    ? dashboard.business.coverPhotoUrls.slice(0, 3)
    : dashboard.business.logoUrl
      ? [dashboard.business.logoUrl]
      : [];

  return (
    <Card>
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <h2 className="text-lg font-bold text-foreground font-manrope sm:text-xl">Portfolio Images</h2>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {images.map((src, index) => (
            <PortfolioThumb key={`${src}-${index}`} src={src} index={index} />
          ))}
          <Link
            to="/vendor/profile"
            className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-[#E6BDB8] text-muted-foreground transition-colors hover:bg-muted sm:h-20 sm:w-20"
            aria-label="Upload portfolio photo"
          >
            <Plus className="size-4 sm:size-5" aria-hidden />
          </Link>
        </div>
        <p className="font-inter text-xs font-normal italic text-muted-foreground leading-relaxed sm:text-sm">
          Add high-resolution photos of your previous work to boost trust.
        </p>
      </div>
    </Card>
  );
}

function PortfolioThumb({ src, index }: { src: string; index: number }) {
  return (
    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted sm:h-20 sm:w-20">
      <img
        src={resolveMediaUrl(src, fallbackImg)}
        alt={`Portfolio ${index + 1}`}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}
