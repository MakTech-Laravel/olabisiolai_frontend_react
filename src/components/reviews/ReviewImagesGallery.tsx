import { resolveMediaUrl } from '@/lib/mediaUrl'
import { cn } from '@/lib/utils'

export type ReviewGalleryImage = {
  id: number
  url: string
  original_filename?: string
}

type ReviewImagesGalleryProps = {
  images: ReviewGalleryImage[]
  className?: string
}

export function ReviewImagesGallery({ images, className }: ReviewImagesGalleryProps) {
  if (images.length === 0) return null

  return (
    <div className={cn('mt-3 flex flex-wrap gap-2', className)}>
      {images.map((image) => {
        const src = resolveMediaUrl(image.url, '')
        if (!src) return null

        return (
          <a
            key={image.id}
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="block size-16 overflow-hidden rounded-lg border border-border-light bg-muted sm:size-20"
          >
            <img
              src={src}
              alt={image.original_filename ?? 'Review image'}
              className="size-full object-cover"
              loading="lazy"
            />
          </a>
        )
      })}
    </div>
  )
}
