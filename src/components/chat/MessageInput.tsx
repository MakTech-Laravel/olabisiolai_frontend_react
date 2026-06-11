import * as React from 'react'
import { FileImage, FileText, Film, Paperclip, Send, Smile, X } from 'lucide-react'

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
}: MessageInputProps) {
  const [emojiOpen, setEmojiOpen] = React.useState(false)
  const emojiAnchorRef = React.useRef<HTMLDivElement>(null)
  const typingTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const pendingAcceptRef = React.useRef<string>(ATTACHMENT_OPTIONS[3].accept)

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

  const openFilePicker = (accept: string) => {
    pendingAcceptRef.current = accept
    if (fileRef.current) {
      fileRef.current.accept = accept
    }
    window.setTimeout(() => fileRef.current?.click(), 0)
  }

  const canSend =
    !disabled &&
    (editingMessage ? value.trim().length > 0 : value.trim().length > 0 || pendingFiles.length > 0)

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
      {pendingFiles.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-t border-chat-border px-4 py-2">
          {pendingFiles.map((f, i) => (
            <button
              key={`${f.name}-${f.size}-${i}`}
              type="button"
              className="rounded-lg bg-muted px-2 py-1 text-xs"
              onClick={() => onRemoveFile?.(i)}
            >
              {f.name} ×
            </button>
          ))}
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
            placeholder="Type your message here..."
            disabled={disabled}
            className="max-h-32 min-h-12 overflow-y-auto rounded-2xl border-0 bg-chat-input-bg py-3 pl-5 pr-12 text-sm text-ink scrollbar-hide placeholder:text-placeholder-text focus-visible:ring-2 focus-visible:ring-chat-accent-ring"
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
