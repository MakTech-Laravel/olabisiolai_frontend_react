import { Plus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVendorProfileContext } from "@/components/sections/vendor/profile/VendorProfileContext";

export function BusinessGalleryCard() {
  const { profile } = useVendorProfileContext();
  if (!profile) return null;

  const photos = profile.coverPhotoUrls;
  const maxSlots = 5;
  const emptySlots = Math.max(0, maxSlots - photos.length);

  return (
    <Card className="overflow-hidden rounded-xl border-border-light shadow-sm">
      <CardHeader className="space-y-1 border-b border-border-light px-6 py-5">
        <CardTitle className="text-lg font-bold text-foreground font-manrope">Business Gallery</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {photos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No cover photos uploaded yet.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            {photos.map((src, index) => (
              <div
                key={`${src}-${index}`}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border-light bg-muted shadow-sm"
              >
                <img src={src} alt={`Cover ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
              </div>
            ))}
            {Array.from({ length: Math.min(emptySlots, 2) }).map((_, slot) => (
              <div
                key={`empty-${slot}`}
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border-[3px] border-dashed border-neutral-300 bg-neutral-50/50 text-muted-foreground"
                aria-hidden
              >
                <Plus className="size-5 stroke-[2.25]" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
