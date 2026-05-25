import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ServicePhotosModalProps = {
  open: boolean;
  onClose: () => void;
  businessName?: string;
  photos: string[];
};

function GalleryImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-xl bg-border-light",
        className,
      )}
    >
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 size-full object-cover"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

export function ServicePhotosModal({
  open,
  onClose,
  businessName,
  photos,
}: ServicePhotosModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const title = businessName ? `${businessName} photos` : "Photos";

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/50 p-4 py-6 sm:p-6 sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-photos-modal-title"
      onClick={onClose}
    >
      <div
        className="relative my-auto w-full max-w-5xl cursor-default rounded-2xl bg-card p-5 shadow-xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="service-photos-modal-title"
            className="font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
          >
            {title}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 shrink-0 rounded-full border-border-gray bg-ice hover:bg-border-light"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close"
          >
            <X className="size-5 text-ink" />
          </Button>
        </div>

        {photos.length === 0 ? (
          <p className="mt-8 text-center text-body-secondary">No photos uploaded yet.</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((src, index) => (
              <GalleryImage
                key={`${src}-${index}`}
                src={src}
                alt={`${businessName ?? "Business"} photo ${index + 1}`}
                className="aspect-4/3 w-full"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
