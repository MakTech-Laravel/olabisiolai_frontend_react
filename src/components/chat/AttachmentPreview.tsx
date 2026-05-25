import { FileText, ImageIcon } from 'lucide-react'

import type { Attachment } from '@/types/attachment'
import { cn } from '@/lib/utils'

function formatSize(n: number | undefined) {
  if (n == null) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function FileLink({
  attachment,
  className,
}: {
  attachment: Attachment
  className?: string
}) {
  const content = (
    <>
      <FileText className="size-4 shrink-0 text-chat-meta" aria-hidden />
      <span className="min-w-0 flex-1 truncate">{attachment.file_name}</span>
      <span className="shrink-0 text-[10px] text-chat-meta">
        {formatSize(attachment.file_size)}
      </span>
    </>
  )

  if (!attachment.url) {
    return (
      <div
        className={cn(
          'flex max-w-xs items-center gap-2 rounded-xl border border-chat-border bg-card/80 px-3 py-2 text-left text-sm text-ink',
          className,
        )}
      >
        {content}
      </div>
    )
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        'flex max-w-xs items-center gap-2 rounded-xl border border-chat-border bg-card/80 px-3 py-2 text-left text-sm text-ink hover:bg-muted/60',
        className,
      )}
    >
      {content}
    </a>
  )
}

export function AttachmentPreview({ items }: { items: Attachment[] }) {
  if (items.length === 0) return null

  const images = items.filter((a) => a.type === 'image' || a.mime_type.startsWith('image/'))
  const rest = items.filter((a) => !images.includes(a))

  return (
    <div className="mt-2 space-y-2">
      {images.length > 0 ? (
        <div className="flex max-w-xs flex-wrap gap-1">
          {images.slice(0, 4).map((a) => {
            const src = a.thumbnail_url || a.url
            if (!src) {
              return <FileLink key={a.uuid} attachment={a} />
            }
            return (
              <a
                key={a.uuid}
                href={a.url || src}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-lg border border-black/10 bg-black/5"
              >
                <img
                  src={src}
                  alt={a.file_name}
                  className="size-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div className="flex items-center gap-1 px-2 py-1 text-[10px] text-chat-meta">
                  <ImageIcon className="size-3" aria-hidden />
                  <span className="truncate">{a.file_name}</span>
                </div>
              </a>
            )
          })}
          {images.length > 4 ? (
            <div className="flex size-24 items-center justify-center rounded-lg bg-muted text-xs font-bold">
              +{images.length - 4}
            </div>
          ) : null}
        </div>
      ) : null}
      {rest.map((a) => (
        <FileLink key={a.uuid} attachment={a} />
      ))}
    </div>
  )
}
