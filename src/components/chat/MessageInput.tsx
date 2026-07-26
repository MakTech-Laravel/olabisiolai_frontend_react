import * as React from 'react'
import { FileImage, FileText, Film, Paperclip, Send, Smile, X } from 'lucide-react'

import { CatalogComposerPreview } from '@/components/chat/CatalogComposerPreview'
import { EmojiPicker } from '@/components/chat/EmojiPicker'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { TYPING_DEBOUNCE_MS, MESSAGING_ATTACHMENT_MAX_COUNT } from '@/constants/config'
import type { CatalogMessagePayload } from '@/features/catalog/catalogMessageContext'
import type { Message } from '@/types/message'
import { cn } from '@/lib/utils'
import { getMessagePreviewText } from '@/utils/messageUtils'

const ATTACHMENT_OPTIONS = [
  {
    id: 'images',
    label: 'Photos',
    accept: '.jpg,.jpeg,.png,.gif,.webp',
    icon: FileImage,
  },
  {
    id: 'documents',
    label: 'Documents',
    accept: '.pdf,.doc,.docx',
    icon: FileText,
  },
  {
    id: 'videos',
    label: 'Videos & audio',
    accept: '.mp4,.mp3,.wav',
    icon: Film,
  },
  {
    id: 'all',
    label: 'All supported files',
    accept: '.jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.mp4,.mp3,.wav',
    icon: Paperclip,
  },
] as const

const PASTE_IMAGE_MIME = /^image\/(png|jpe?g|gif|webp)$/i

function extensionForImageMime(mime: string): string {
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg'
  if (mime.includes('gif')) return 'gif'
  if (mime.includes('webp')) return 'webp'
  return 'png'
}

function filesFromClipboard(data: DataTransfer | null): File[] {
  if (!data) return []

  const fromItems: File[] = []
  for (const item of Array.from(data.items ?? [])) {
    if (item.kind !== 'file' || !PASTE_IMAGE_MIME.test(item.type)) continue
    const raw = item.getAsFile()
    if (!raw) continue
    const ext = extensionForImageMime(raw.type || 'image/png')
    const name =
      raw.name && raw.name.trim() !== '' && raw.name !== 'image.png'
        ? raw.name
        : `pasted-image-${Date.now()}-${fromItems.length + 1}.${ext}`
    fromItems.push(raw.name === name ? raw : new File([raw], name, { type: raw.type || `image/${ext}` }))
  }

  if (fromItems.length > 0) return fromItems

  return Array.from(data.files ?? []).filter((file) => PASTE_IMAGE_MIME.test(file.type))
}

function PendingImageThumb({
  file,
  onRemove,
}: {
  file: File
  onRemove: () => void
}) {
  const [src, setSrc] = React.useState<string | null>(null)

  React.useEffect(() => {
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  return (
    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-chat-border bg-muted sm:size-18">
      {src ? (
        <img src={src} alt={file.name} className="size-full object-cover" />
      ) : (
        <div className="grid size-full place-items-center text-[10px] text-stat-muted">Image</div>
      )}
      <button
        type="button"
        aria-label={`Remove ${file.name}`}
        onClick={onRemove}
        className="absolute right-1 top-1 grid size-5 place-items-center rounded-md bg-black/70 text-white hover:bg-black/85"
      >
        <X className="size-3" aria-hidden />
      </button>
    </div>
  )
}

interface MessageInputProps {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  disabled?: boolean
  replyingTo: Message | null
  onCancelReply: () => void
  editingMessage: Message | null
  onCancelEdit: () => void
  onTyping: () => void
  onFiles: (files: FileList | File[] | null) => void
  pendingFiles?: File[]
  onRemoveFile?: (index: number) => void
  catalogAttachment?: CatalogMessagePayload | null
  catalogImageLoading?: boolean
  onDismissCatalog?: () => void
}

export function MessageInput({
  value,
  onChange,
  onSend,
  disabled,
  replyingTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onTyping,
  onFiles,
  pendingFiles = [],
  onRemoveFile,
  catalogAttachment = null,
  catalogImageLoading = false,
  onDismissCatalog,
}: MessageInputProps) {
  const [emojiOpen, setEmojiOpen] = React.useState(false)
  const emojiAnchorRef = React.useRef<HTMLDivElement>(null)
  const typingTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const pendingAcceptRef = React.useRef<string>(ATTACHMENT_OPTIONS[3].accept)

  const catalogImageFile = React.useMemo(
    () =>
      catalogAttachment
        ? (pendingFiles.find((file) => file.type.startsWith('image/')) ?? null)
        : null,
    [pendingFiles, catalogAttachment],
  )

  const displayFiles = React.useMemo(
    () =>
      catalogImageFile
        ? pendingFiles.filter((file) => file !== catalogImageFile)
        : pendingFiles,
    [pendingFiles, catalogImageFile],
  )

  const imageFiles = React.useMemo(
    () => displayFiles.filter((file) => file.type.startsWith('image/')),
    [displayFiles],
  )

  const otherFiles = React.useMemo(
    () => displayFiles.filter((file) => !file.type.startsWith('image/')),
    [displayFiles],
  )

  const handleChange = (v: string) => {
    onChange(v)
    onTyping()
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      onTyping()
    }, TYPING_DEBOUNCE_MS)
  }

  const insertAtCursor = (emoji: string) => {
    onChange(value + emoji)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (disabled || editingMessage) return

    const pastedImages = filesFromClipboard(e.clipboardData)
    if (pastedImages.length === 0) return

    e.preventDefault()

    const remainingSlots = MESSAGING_ATTACHMENT_MAX_COUNT - pendingFiles.length
    if (remainingSlots <= 0) return

    onFiles(pastedImages.slice(0, remainingSlots))
  }

  const openFilePicker = (accept: string) => {
    pendingAcceptRef.current = accept
    if (fileRef.current) {
      fileRef.current.accept = accept
    }
    window.setTimeout(() => fileRef.current?.click(), 0)
  }

  const canSend =
    !disabled &&
    (editingMessage
      ? value.trim().length > 0
      : value.trim().length > 0 || pendingFiles.length > 0 || Boolean(catalogAttachment))

  return (
    <div className="relative">
      {replyingTo ? (
        <div className="mb-2 flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-xs">
          <span className="truncate text-chat-meta">
            Replying to: {getMessagePreviewText(replyingTo).slice(0, 80)}
          </span>
          <button type="button" aria-label="Cancel reply" onClick={onCancelReply}>
            <X className="size-4" />
          </button>
        </div>
      ) : null}
      {editingMessage ? (
        <div className="mb-2 flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-xs">
          <span className="text-chat-meta">Editing message</span>
          <button type="button" aria-label="Cancel edit" onClick={onCancelEdit}>
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      {catalogAttachment && onDismissCatalog ? (
        <CatalogComposerPreview
          catalog={catalogAttachment}
          imageFile={catalogImageFile}
          imageLoading={catalogImageLoading}
          onDismiss={onDismissCatalog}
        />
      ) : null}

      {imageFiles.length > 0 || otherFiles.length > 0 ? (
        <div className="space-y-2 border-t border-chat-border px-4 py-2">
          {imageFiles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {imageFiles.map((f) => (
                <PendingImageThumb
                  key={`${f.name}-${f.size}-${f.lastModified}`}
                  file={f}
                  onRemove={() => onRemoveFile?.(pendingFiles.indexOf(f))}
                />
              ))}
            </div>
          ) : null}
          {otherFiles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {otherFiles.map((f, i) => (
                <button
                  key={`${f.name}-${f.size}-${i}`}
                  type="button"
                  className="rounded-lg bg-muted px-2 py-1 text-xs"
                  onClick={() => onRemoveFile?.(pendingFiles.indexOf(f))}
                >
                  {f.name} ×
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <footer className="flex items-end gap-2 border-t border-chat-border-footer bg-card px-3 py-3 backdrop-blur-sm sm:gap-3 sm:px-6 sm:py-4">
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={pendingAcceptRef.current}
          className="hidden"
          onChange={(e) => {
            const list = e.target.files
            if (list?.length) {
              const capped = Array.from(list).slice(0, MESSAGING_ATTACHMENT_MAX_COUNT)
              onFiles(capped)
            }
            e.target.value = ''
          }}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 shrink-0 rounded-xl text-ink hover:bg-muted"
              aria-label="Attach file"
              disabled={disabled}
            >
              <Paperclip className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {ATTACHMENT_OPTIONS.map((option) => {
              const Icon = option.icon
              return (
                <DropdownMenuItem
                  key={option.id}
                  onClick={() => openFilePicker(option.accept)}
                  className="gap-2"
                >
                  <Icon className="size-4" />
                  {option.label}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="relative min-w-0 flex-1">
          <Textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={handlePaste}
            placeholder={
              catalogAttachment
                ? 'Add a message about this item…'
                : 'Type your message here...'
            }
            disabled={disabled}
            className="max-h-32 min-h-14 overflow-y-auto rounded-2xl border-0 bg-chat-input-bg py-3 pl-5 pr-12 text-sm text-ink scrollbar-hide placeholder:text-placeholder-text focus-visible:ring-2 focus-visible:ring-chat-accent-ring"
          />
          <div ref={emojiAnchorRef} className="absolute bottom-1.5 right-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 text-stat-muted hover:bg-transparent hover:text-ink"
              aria-label="Emoji"
              onClick={() => setEmojiOpen((v) => !v)}
            >
              <Smile className="size-5" />
            </Button>
            <EmojiPicker
              open={emojiOpen}
              onClose={() => setEmojiOpen(false)}
              onPick={insertAtCursor}
              anchorRef={emojiAnchorRef}
            />
          </div>
        </div>
        <Button
          type="button"
          size="icon"
          disabled={!canSend}
          className={cn(
            'size-11 shrink-0 rounded-xl bg-chat-accent text-text-white shadow-md hover:opacity-90 sm:size-12',
          )}
          aria-label="Send message"
          onClick={onSend}
        >
          <Send className="size-5" />
        </Button>
      </footer>
    </div>
  )
}
