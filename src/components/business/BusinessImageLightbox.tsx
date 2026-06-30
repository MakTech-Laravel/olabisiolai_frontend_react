import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SWIPE_THRESHOLD_PX = 48;

type BusinessImageLightboxProps = {
  open: boolean;
  onClose: () => void;
  photos: string[];
  initialIndex?: number;
  businessName?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function distanceBetweenTouches(touches: React.TouchList) {
  if (touches.length < 2) return 0;
  const a = touches[0];
  const b = touches[1];
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.hypot(dx, dy);
}

export function BusinessImageLightbox({
  open,
  onClose,
  photos,
  initialIndex = 0,
  businessName,
}: BusinessImageLightboxProps) {
  const [index, setIndex] = React.useState(initialIndex);
  const [scale, setScale] = React.useState(1);
  const [translate, setTranslate] = React.useState({ x: 0, y: 0 });
  const [loaded, setLoaded] = React.useState(false);

  const swipeStartX = React.useRef<number | null>(null);
  const pinchStartDistance = React.useRef<number | null>(null);
  const pinchStartScale = React.useRef(1);
  const dragStart = React.useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const imageRef = React.useRef<HTMLImageElement | null>(null);

  const total = photos.length;
  const currentSrc = photos[index] ?? "";

  const markImageLoaded = React.useCallback(() => {
    const img = imageRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
      return true;
    }
    return false;
  }, []);

  React.useEffect(() => {
    if (!open) return;
    setIndex(clamp(initialIndex, 0, Math.max(0, photos.length - 1)));
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, [open, initialIndex, photos.length]);

  React.useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, [index, currentSrc]);

  React.useLayoutEffect(() => {
    if (!open || !currentSrc) {
      setLoaded(false);
      return;
    }
    if (!markImageLoaded()) {
      setLoaded(false);
    }
  }, [open, currentSrc, markImageLoaded]);

  const goPrev = React.useCallback(() => {
    if (total <= 1) return;
    setIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const goNext = React.useCallback(() => {
    if (total <= 1) return;
    setIndex((i) => (i + 1) % total);
  }, [total]);

  React.useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, goPrev, goNext]);

  React.useEffect(() => {
    if (!open || total <= 1) return;
    const preload = (offset: number) => {
      const src = photos[(index + offset + total) % total];
      if (!src) return;
      const img = new Image();
      img.src = src;
    };
    preload(1);
    preload(-1);
  }, [index, open, photos, total]);

  if (!open || total === 0) return null;

  const title = businessName ? `${businessName} photos` : "Photos";

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.12 : -0.12;
    setScale((current) => clamp(current + delta, MIN_SCALE, MAX_SCALE));
  };

  const handleDoubleClick: React.MouseEventHandler<HTMLImageElement> = () => {
    setScale((current) => (current > 1 ? 1 : 2));
    if (scale > 1) setTranslate({ x: 0, y: 0 });
  };

  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (event) => {
    if (event.touches.length === 2) {
      pinchStartDistance.current = distanceBetweenTouches(event.touches);
      pinchStartScale.current = scale;
      swipeStartX.current = null;
      return;
    }

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      if (scale > 1) {
        dragStart.current = {
          x: touch.clientX,
          y: touch.clientY,
          tx: translate.x,
          ty: translate.y,
        };
      } else {
        swipeStartX.current = touch.clientX;
      }
    }
  };

  const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (event) => {
    if (event.touches.length === 2 && pinchStartDistance.current) {
      const nextDistance = distanceBetweenTouches(event.touches);
      const ratio = nextDistance / pinchStartDistance.current;
      setScale(clamp(pinchStartScale.current * ratio, MIN_SCALE, MAX_SCALE));
      return;
    }

    if (event.touches.length === 1 && scale > 1 && dragStart.current) {
      const touch = event.touches[0];
      const start = dragStart.current;
      setTranslate({
        x: start.tx + (touch.clientX - start.x),
        y: start.ty + (touch.clientY - start.y),
      });
    }
  };

  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = (event) => {
    pinchStartDistance.current = null;
    dragStart.current = null;

    if (scale === 1 && swipeStartX.current !== null && event.changedTouches.length === 1) {
      const delta = event.changedTouches[0].clientX - swipeStartX.current;
      if (Math.abs(delta) >= SWIPE_THRESHOLD_PX) {
        if (delta < 0) goNext();
        else goPrev();
      }
    }

    swipeStartX.current = null;
  };

  const modal = (
    <div
      className="fixed inset-0 z-[110] flex flex-col bg-black/92"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-white sm:px-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white/90 sm:text-base">{title}</p>
          <p className="text-xs text-white/70 sm:text-sm">
            {index + 1} of {total}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="size-5" />
        </Button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4 sm:px-10"
        onClick={(event) => event.stopPropagation()}
        onWheel={handleWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {total > 1 ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 z-10 hidden size-11 -translate-y-1/2 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 sm:inline-flex"
              onClick={goPrev}
              aria-label="Previous photo"
            >
              <ChevronLeft className="size-6" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 z-10 hidden size-11 -translate-y-1/2 rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 sm:inline-flex"
              onClick={goNext}
              aria-label="Next photo"
            >
              <ChevronRight className="size-6" />
            </Button>
          </>
        ) : null}

        <div className="relative flex h-full w-full max-w-6xl items-center justify-center">
          {!loaded ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="size-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </div>
          ) : null}
          <img
            key={currentSrc}
            ref={(node) => {
              imageRef.current = node;
              if (node?.complete && node.naturalWidth > 0) {
                setLoaded(true);
              }
            }}
            src={currentSrc}
            alt={`${businessName ?? "Business"} photo ${index + 1}`}
            className={cn(
              "max-h-[calc(100vh-8rem)] max-w-full touch-none select-none object-contain transition-opacity duration-200",
              loaded ? "opacity-100" : "opacity-0",
            )}
            style={{
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            }}
            draggable={false}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
            onDoubleClick={handleDoubleClick}
          />
        </div>
      </div>

      {total > 1 ? (
        <div
          className="flex shrink-0 justify-center gap-2 overflow-x-auto px-4 pb-4"
          onClick={(event) => event.stopPropagation()}
        >
          {photos.map((src, photoIndex) => (
            <button
              key={`${src}-${photoIndex}`}
              type="button"
              className={cn(
                "size-14 shrink-0 overflow-hidden rounded-lg border-2 bg-[#f3f4f6] sm:size-16",
                photoIndex === index ? "border-white" : "border-transparent opacity-70 hover:opacity-100",
              )}
              onClick={() => setIndex(photoIndex)}
              aria-label={`View photo ${photoIndex + 1}`}
            >
              <img src={src} alt="" className="size-full object-contain" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );

  return createPortal(modal, document.body);
}
