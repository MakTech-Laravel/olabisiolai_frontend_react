import { ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { VendorDashboardCardProps } from "../dashboardTypes";

import fallbackImg from "@/assets/protfolio_image/Property Image 1.png";

export function PremiumPortfolioGallery({ dashboard }: VendorDashboardCardProps) {
  const sources = dashboard.business.coverPhotoUrls.length
    ? dashboard.business.coverPhotoUrls
    : dashboard.business.logoUrl
      ? [dashboard.business.logoUrl]
      : [];

  const galleryImages = sources.length
    ? sources.slice(0, 4).map((src, index) => ({
      id: `${index}`,
      src,
      alt: `Portfolio ${index + 1}`,
    }))
    : [{ id: "0", src: fallbackImg, alt: "Portfolio placeholder" }];

  return (
    <Card className="rounded-2xl border-border-light bg-card shadow-sm">
      <CardContent className="space-y-6 p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-bold text-foreground font-manrope">Portfolio gallery</h3>
          <Link
            to="/vendor/profile"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline font-inter"
          >
            <ImageIcon className="size-4" aria-hidden />
            Manage media
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {galleryImages.map((img, index) => (
            <div
              key={`${img.id}-${index}`}
              className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border-light bg-muted"
            >
              <img
                src={resolveMediaUrl(img.src, fallbackImg)}
                alt={img.alt}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
