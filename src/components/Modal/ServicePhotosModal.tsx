import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { BusinessCatalogImage } from "@/components/business/BusinessCatalogImage";
import { BusinessImageLightbox } from "@/components/business/BusinessImageLightbox";
import { Button } from "@/components/ui/button";

type ServicePhotosModalProps = {
  open: boolean;
  onClose: () => void;
  businessName?: string;
  photos: string[];
  initialIndex?: number;
};

export function ServicePhotosModal({
  open,
  onClose,
  businessName,
  photos,
  initialIndex = 0,
}: ServicePhotosModalProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(initialIndex);

  useEffect(() => {
    if (!open) return;
    setLightboxIndex(initialIndex);
    setLightboxOpen(false);
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !lightboxOpen) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightboxOpen, onClose, open]);

  if (!open) return null;

  const title = businessName ? `${businessName} photos` : "Photos";

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const modal = (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/50 p-4 py-6 sm:p-6 sm:py-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-photos-modal-title"
        onClick={onClose}
      >
        <div
          className="relative my-auto w-full max-w-5xl cursor-default rounded-2xl bg-card p-5 shadow-xl sm:p-8"
          onClick={(event) => event.stopPropagation()}
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
              onClick={(event) => {
                event.stopPropagation();
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
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((src, index) => (
                <BusinessCatalogImage
                  key={`${src}-${index}`}
                  src={src}
                  alt={`${businessName ?? "Business"} photo ${index + 1}`}
                  onClick={() => openLightbox(index)}
                  className="rounded-xl"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <BusinessImageLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        photos={photos}
        initialIndex={lightboxIndex}
        businessName={businessName}
      />
    </>
  );

  return createPortal(modal, document.body);
}
