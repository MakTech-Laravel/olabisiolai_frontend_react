import { useRef } from "react";
import { Plus, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useVendorProfileContext } from "@/components/sections/vendor/profile/VendorProfileContext";
import { totalCoverCount } from "@/features/business/vendorProfileDraft";
import { FREE_PHOTO_LIMIT } from "@/constants/planLimits";

const DEFAULT_MAX_COVER = FREE_PHOTO_LIMIT;

type BusinessGallerySectionProps = {
  variant: "free" | "premium";
};

function GalleryThumb({
  src,
  alt,
  onRemove,
  showRemove,
}: {
  src: string;
  alt: string;
  onRemove?: () => void;
  showRemove?: boolean;
}) {
  return (
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border-light bg-muted shadow-sm">
      <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      {showRemove && onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
          aria-label="Remove photo"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function AddSlot({ onPick, disabled }: { onPick: (files: FileList | null) => void; disabled?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        tabIndex={-1}
        aria-hidden
        disabled={disabled}
        onChange={(e) => {
          onPick(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border-[3px] border-dashed border-neutral-300 bg-neutral-50/50 text-muted-foreground transition-colors",
          !disabled && "cursor-pointer hover:border-sky-400/60 hover:bg-neutral-100/80",
          disabled && "cursor-not-allowed opacity-50",
        )}
        aria-label="Add gallery image"
      >
        <Plus className="size-5 stroke-[2.25]" aria-hidden />
      </button>
    </>
  );
}

export function BusinessGallerySection({ variant }: BusinessGallerySectionProps) {
  const {
    profile,
    isEditing,
    draft,
    addCoverFiles,
    removeExistingCover,
    removeNewCover,
    fieldErrors,
    maxCoverPhotos,
  } = useVendorProfileContext();
  if (!profile) return null;

  const isPremium = variant === "premium";
  const displayUrls = isEditing && draft
    ? [...draft.existingCoverUrls, ...draft.newCoverPreviews]
    : profile.coverPhotoUrls;

  const total = isEditing && draft ? totalCoverCount(draft) : displayUrls.length;
  const coverLimit = maxCoverPhotos ?? DEFAULT_MAX_COVER;
  const canAddMore = isEditing && total < coverLimit;
  const hasPhotos = displayUrls.length > 0;

  const handlePick = (files: FileList | null) => {
    if (!files?.length) return;
    addCoverFiles(Array.from(files));
  };

  return (
    <Card className="h-fit w-full overflow-hidden rounded-xl border-border-light shadow-sm">
      {isPremium ? (
        <div className="flex items-center justify-between border-b border-border-light px-6 py-5">
          <h2 className="text-lg font-bold text-foreground font-manrope">Business Gallery</h2>
          <div className="font-inter text-sm font-bold text-chat-accent">
            {displayUrls.length} photo{displayUrls.length === 1 ? "" : "s"}
          </div>
        </div>
      ) : (
        <CardHeader className="space-y-1 border-b border-border-light px-6 py-5">
          <CardTitle className="text-lg font-bold text-foreground font-manrope">Business Gallery</CardTitle>
        </CardHeader>
      )}

      <CardContent className="p-6">
        {isEditing ? (
          <p className="mb-3 text-xs font-medium text-muted-foreground">
            {total}/{coverLimit} photos on your {isPremium ? "Premium" : "Free"} plan
          </p>
        ) : null}
        {!hasPhotos && !isEditing ? (
          <p className="text-sm text-muted-foreground">No cover photos uploaded yet.</p>
        ) : (
          <div className="flex flex-wrap items-start gap-4">
            {isEditing && draft
              ? draft.existingCoverUrls.map((src, index) => (
                <GalleryThumb
                  key={`existing-${src}-${index}`}
                  src={src}
                  alt={`Cover ${index + 1}`}
                  showRemove
                  onRemove={() => removeExistingCover(index)}
                />
              ))
              : displayUrls.map((src, index) => (
                <GalleryThumb key={`${src}-${index}`} src={src} alt={`Cover ${index + 1}`} />
              ))}

            {isEditing && draft
              ? draft.newCoverPreviews.map((src, index) => (
                <GalleryThumb
                  key={`new-${src}-${index}`}
                  src={src}
                  alt={`New cover ${index + 1}`}
                  showRemove
                  onRemove={() => removeNewCover(index)}
                />
              ))
              : null}

            {isEditing && canAddMore ? <AddSlot onPick={handlePick} /> : null}
          </div>
        )}

        {isEditing && fieldErrors.cover_photos ? (
          <p className="mt-3 text-xs text-destructive">{fieldErrors.cover_photos}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
